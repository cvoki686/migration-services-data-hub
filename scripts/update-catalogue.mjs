import ExcelJS from "exceljs";
import fs from "node:fs/promises";

const shareUrl = process.env.WORKBOOK_SHARE_URL;
const tenantId = process.env.MS_TENANT_ID;
const clientId = process.env.MS_CLIENT_ID;
const clientSecret = process.env.MS_CLIENT_SECRET;

if (!shareUrl || !tenantId || !clientId || !clientSecret) {
  throw new Error("Missing WORKBOOK_SHARE_URL or Microsoft Graph credentials.");
}

function shareId(url) {
  return "u!" + Buffer.from(url, "utf8").toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function getToken() {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  });
  const r = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    body
  });
  if (!r.ok) throw new Error(`Token request failed (${r.status})`);
  return (await r.json()).access_token;
}
function text(cell) {
  if (!cell) return "";
  if (cell.text !== undefined) return String(cell.text);
  return cell.value == null ? "" : String(cell.value);
}
function linkOrText(cell) {
  const v = cell?.value;
  if (v && typeof v === "object" && v.hyperlink) return String(v.hyperlink);
  if (cell?.hyperlink) return String(cell.hyperlink);
  return text(cell);
}

const token = await getToken();
const headers = {Authorization: `Bearer ${token}`};
const itemResponse = await fetch(
  `https://graph.microsoft.com/v1.0/shares/${shareId(shareUrl)}/driveItem`,
  {headers}
);
if (!itemResponse.ok) throw new Error(`Cannot resolve workbook (${itemResponse.status})`);
const item = await itemResponse.json();

const contentResponse = await fetch(
  `https://graph.microsoft.com/v1.0/drives/${item.parentReference.driveId}/items/${item.id}/content`,
  {headers}
);
if (!contentResponse.ok) throw new Error(`Cannot download workbook (${contentResponse.status})`);

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(Buffer.from(await contentResponse.arrayBuffer()));
const ws = workbook.worksheets[0];
if (!ws) throw new Error("Workbook contains no worksheet.");

const headersByColumn = {};
ws.getRow(1).eachCell({includeEmpty: true}, (cell, col) => {
  headersByColumn[col] = text(cell).trim();
});

const items = [];
for (let rowNo = 2; rowNo <= ws.rowCount; rowNo++) {
  const row = ws.getRow(rowNo);
  const raw = {};
  for (const [col, heading] of Object.entries(headersByColumn)) {
    if (!heading) continue;
    const cell = row.getCell(Number(col));
    raw[heading] =
      heading === "Data_Source_URL" || heading === "Related_Dashboard_URL"
        ? linkOrText(cell)
        : text(cell);
  }
  if (!String(raw.Data_Title || "").trim()) continue;

  items.push({
    title: String(raw.Data_Title || "").trim(),
    theme: String(raw.Theme || "").trim(),
    publisher: String(raw.Publisher || "").trim(),
    source: String(raw.Data_Source_URL || "").trim(),
    sourceDisplay: String(raw.Data_Source_URL || "").trim(),
    latestAvailable: String(raw["Latest Available Data"] || raw.Latest_Available_Data || "").trim(),
    year: String(raw.Year || raw.Data_Year || "").trim(),
    geography: String(raw.Geography || "").trim(),
    frequency: String(raw.Update_Frequency || "").trim(),
    description: String(raw.Description || "").trim(),
    keywords: String(raw.Keywords || "").trim(),
    dashboard: String(raw.Related_Dashboard_URL || "").trim(),
    lastChecked: String(raw.Last_Checked || "").trim(),
    comments: String(raw.Comments || "").trim()
  });
}

await fs.mkdir("data", {recursive: true});
await fs.writeFile(
  "data/catalogue.json",
  JSON.stringify({items, refreshedAt: new Date().toISOString()}, null, 2) + "\n",
  "utf8"
);
console.log(`Published ${items.length} catalogue records.`);
