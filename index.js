require("dotenv").config();
const express = require("express");
const EbayAuthToken = require("ebay-oauth-nodejs-client");
const { google } = require("googleapis");

const {
  getAccessWithRefreshEbay,
  getSellerList,
  postItemInShopify,
  getItemsFromShopify,
  getAllProducts,
  getAllSoldProducts,
  updateProducStatus,
} = require("./utils/http");

const { makeItemForGoogleSheet } = require("./utils/helpers");

const {
  ebayScopes,
  spreadsheetId,
  googleSpreadSheetColumns,
  googleSpreadSheetName,
  shopifyConfig,
} = require("./utils/constants");

const ebayAuthToken = new EbayAuthToken({
  clientId: process.env.EBAY_PRODUCTION_CLIENT_ID,
  clientSecret: process.env.EBAY_PRODUCTION_CLIENT_SECRET,
  redirectUri: process.env.EBAY_PRODUCTION_REDIRECTURI,
  baseUrl: process.env.EBAY_PRODUCTION_BASEURL,
  env: process.env.EBAY_PRODUCTION_ENV,
});

const app = express();
const PORT = process.env.PORT || 3000;

let isBlocked = false;
let status = "completed " + new Date();

app.get("/", async (req, res) => {
  try {
    const authUrl = ebayAuthToken.generateUserAuthorizationUrl(
      "PRODUCTION",
      ebayScopes
    ); // get user consent url.

    res.redirect(authUrl);
  } catch (error) {
    res.json({
      apiErrorMessage: "something happened while getting authUrl in / ",
      error,
    });
  }
});

app.get("/status ", async (req, res) => {
  return res.json(status + "Synchronization disable " + isBlocked);
});

app.get("/sync_disable", async (req, res) => {
  isBlocked = true;
  return res.json("Synchronization disable");
});
app.get("/sync_allow", async (req, res) => {
  isBlocked = false;
  return res.json("Synchronization allow");
});

app.get("/authenticated_ebay", async (req, res) => {
  if(isBlocked) return res.json("Synchronization disable");
  try {
    const { code } = req.query;
    // if (!code) return res.send("no code for exchangeCodeForAccessToken");

    // const tokenResponse = await ebayAuthToken.exchangeCodeForAccessToken(
    //   "PRODUCTION",
    //   code
    // );

    // const { access_token, refresh_token } = JSON.parse(tokenResponse);
    // console.log(access_token);
    // console.log("refresh_token", refresh_token);
    const access_token = `v^1.1#i^1#r^0#p^3#I^3#f^0#t^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`;
    const refresh_token = `v^1.1#i^1#r^1#p^3#I^3#f^0#t^Ul4xMF84OjEzNEU1MzczMTk5RUM2NzA5MDgwREQ2RkI3MzdDMDk0XzNfMSNFXjI2MA==`;

    const access_token_encoded = encodeURIComponent(access_token);
    const refresh_token_encoded = encodeURIComponent(refresh_token);

    res.redirect(
      `/place_items_in_shopify?access_token_encoded=${access_token_encoded}&refresh_token_encoded=${refresh_token_encoded}`
    );
  } catch (error) {
    res.json({
      apiErrorMessage:
        "something happened while getting authUrl in /authenticatedebay ",
      error,
    });
  }
});

app.get("/place_items_in_shopify", async (req, res) => {
  try {
    const { access_token_encoded, refresh_token_encoded } = req.query;
    let access_token = decodeURIComponent(access_token_encoded);
    const refresh_token = decodeURIComponent(refresh_token_encoded);

    function makeNewItemsStartFromDate(month, year) {
      const nextMonthIntervalString = `${(month > 9 ? "" : "0") + month}`;
      return `${year}-${nextMonthIntervalString}-01` + "T00:00:00.000Z";
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const EndTimeFrom = currentDate.toISOString();
    const EndTimeTo = makeNewItemsStartFromDate(currentMonth + 3, currentYear);
    // console.log("EndTimeFrom", EndTimeFrom);
    // console.log("EndTimeTo", EndTimeTo);

    let firstItemsRequest = await getSellerList({
      EndTimeFrom,
      EndTimeTo,
      page: 3,
      access_token,
    });
    // console.log("firstItemsRequest");
    // status = "start sync";
    // return;
    res.json(firstItemsRequest.GetSellerListResponse);
    if (
      firstItemsRequest.GetSellerListResponse.Errors &&
      firstItemsRequest.GetSellerListResponse.Errors.ShortMessage
    ) {
      access_token = await getAccessWithRefreshEbay(refresh_token);

      firstItemsRequest = await getSellerList({
        EndTimeFrom,
        EndTimeTo,
        page: 1,
        access_token,
      });
    }

    for (
      let index = 0;
      index < firstItemsRequest.GetSellerListResponse.ReturnedItemCountActual;
      index++
    ) {
      await postItemInShopify(
        firstItemsRequest.GetSellerListResponse.ItemArray.Item[index]
      );
    }

    for (
      let page = 2; // because page first we got in first request
      page <=
      firstItemsRequest.GetSellerListResponse.PaginationResult
        .TotalNumberOfPages;
      page++
    ) {
      let paginatedItems = await getSellerList({
        EndTimeFrom,
        EndTimeTo,
        page,
        access_token,
      });

      console.log(`itemRequest page ${page}`);

      if (
        paginatedItems.GetSellerListResponse.Errors &&
        paginatedItems.GetSellerListResponse.Errors.ShortMessage
      ) {
        access_token = await getAccessWithRefreshEbay(refresh_token);

        paginatedItems = await getSellerList({
          EndTimeFrom,
          EndTimeTo,
          page,
          access_token,
        });
      }

      for (
        let index = 0;
        index < paginatedItems.GetSellerListResponse.ReturnedItemCountActual;
        index++
      ) {
        await postItemInShopify(
          paginatedItems.GetSellerListResponse.ItemArray.Item[index]
        );
      }
    }

    status =
      "successfully synced all items from ebay with shopify " + new Date();
    res.redirect(`/sold_items_in_archive`);
  } catch (error) {
    console.log(error);
    res.json({
      apiErrorMessage:
        "something happened while getting authUrl in /authenticateshopify ",
      error,
    });
  }
});

app.get("/make_google_sheet", async (req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    const client = await auth.getClient();
    const googleSheets = google.sheets({ version: "v4", auth: client });

    // clear all sheet before adding new values
    await googleSheets.spreadsheets.values.clear({
      auth,
      spreadsheetId,
      range: googleSpreadSheetName,
    });

    const shopifyItemsObject = await getItemsFromShopify();
    let itemsForGoogle = [];

    shopifyItemsObject.data.forEach(async (item) => {
      const itemForSheet = makeItemForGoogleSheet(item);
      itemsForGoogle.push(itemForSheet);
    });

    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: googleSpreadSheetName,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [googleSpreadSheetColumns, ...itemsForGoogle],
      },
    });

    let makeNextRequestFlag = true;
    let nextPage = shopifyItemsObject.link.next.page_info;

    while (makeNextRequestFlag) {
      const shopifyItemsObject = await getItemsFromShopify(nextPage);
      let itemsForGoogle = [];

      shopifyItemsObject.data.forEach(async (item) => {
        const itemForSheet = makeItemForGoogleSheet(item);
        itemsForGoogle.push(itemForSheet);
      });

      await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: googleSpreadSheetName,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [...itemsForGoogle],
        },
      });

      if (shopifyItemsObject.link.next) {
        nextPage = shopifyItemsObject.link.next.page_info;
      } else {
        makeNextRequestFlag = false;
      }
    }

    res.send("successfully created google sheet");
  } catch (error) {
    console.log(error);
    res.json(error);
  }
});

app.get("/remove_duplicates", async (req, res) => {
  const products = await getAllProducts();

  console.log('====================================');
  console.log(products.length);
  console.log('====================================');
})

app.get("/sold_items_in_archive", async (req, res) => {
  const products = await getAllProducts();
  const soldProducts = await getAllSoldProducts();

  const filteredSoldProducts = soldProducts.filter((order) =>
    order.line_items.some((item) => item.fulfillment_status === "fulfilled")
  ); // список выполненных заказов

  filteredSoldProducts.map((orders) => {
    orders.line_items.map((order) => {
      const activeProduct = products.find(
        (product) => product.id === order.product_id
      );
      try {
        if (activeProduct) {
          updateProducStatus(activeProduct.id, "archived");
          return;
        }
      } catch (error) {
        res.send(`something happened in sold_items_in_archive: ${error}`);
      }
    });
  });

  res.redirect("/make_google_sheet");
});

app.listen(PORT, () => {
  console.log(`App listening port ${PORT}`);
});
