const ebayScopes = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.marketing",
  "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
];

const shopifyGetItemsLimit = 250;

const shopifyConfig = {
  headers: {
    "Accept-Encoding": "gzip,deflate,compress",
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": process.env.SHOPIFY_SECRET_TOKEN,
  },
};

const spreadsheetId = "1umEnpNxOrIL1DIGXECPY1GxaLJr_fRlPapxDJcM7yS4";

const googleSpreadSheetName = "Shopify Products";

const googleSpreadSheetColumns = [
  "EbayID",
  "Title",
  "Sku",
  'Description',
  "Price",
  "ShipToLocations",
  'Quantity',
  'ShippingServiceCost',
  'Status',
  'Main Image',
  "Image 2",
  "Image 3",
  "Image 4",
  "Image 5",
  "Image 6",
  "Image 7",
  "Image 8",
  "Image 9",
  "Image 10",
];

const vendors = [
  "Allen-Bradley",
  "Aprilia",
  "Baodiao",
  "BMW",
  "Buell Blast",
  "Can-Am",
  "Domnick Hunter",
  "Ducati",
  "EBC",
  "Fanuc",
  "Ford",
  "Harley-davidson",
  "Honda",
  "Husqvarna",
  "Hyosung",
  "Kawasaki",
  "KTM",
  "Kymco",
  "Mitsubishi",
  "Motion-PRO",
  "Piaggio",
  "Polaris",
  "Sea-doo",
  "Suzui",
  "Suzuki",
  "Triumph",
  "Universal Retro",
  "Yamaha",
  "Yaskawa",
  "Znen",
  "Zongshen",
];

module.exports = {
  ebayScopes,
  shopifyGetItemsLimit,
  shopifyConfig,
  spreadsheetId,
  googleSpreadSheetName,
  googleSpreadSheetColumns,
  vendors,
};
