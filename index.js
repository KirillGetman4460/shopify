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
    const access_token = `v^1.1#i^1#f^0#p^3#r^0#I^3#t^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`;
    const refresh_token = `v^1.1#i^1#f^0#p^3#I^3#r^1#t^Ul4xMF8xMTo1MEEyMTg5NDNDRUY2M0IwRDgzNDkwM0M5ODU0MTE5MF8zXzEjRV4yNjA=`;

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
    // console.log(firstItemsRequest);
    // status = "start sync";
    
    //res.json(firstItemsRequest.GetSellerListResponse);
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
    // const auth = new google.auth.GoogleAuth({
    //   keyFile: "credentials.json",
    //   scopes: "https://www.googleapis.com/auth/spreadsheets",
    // });
    // const client = await auth.getClient();
    // const googleSheets = google.sheets({ version: "v4", auth: client });

    // // clear all sheet before adding new values
    // await googleSheets.spreadsheets.values.clear({
    //   auth,
    //   spreadsheetId,
    //   range: googleSpreadSheetName,
    // });

    let firstItemsRequest = await getSellerList({
      EndTimeFrom,
      EndTimeTo,
      page: 3,
      access_token,
    });
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
    // await googleSheets.spreadsheets.values.append({
    //   auth,
    //   spreadsheetId,
    //   range: googleSpreadSheetName,
    //   valueInputOption: "USER_ENTERED",
    //   resource: {
    //     values: [googleSpreadSheetColumns],
    //   },
    // });
    
    
    for (
      let index = 0;
      index < firstItemsRequest.GetSellerListResponse.ReturnedItemCountActual;
      index++
    ) {
      const EbayItemsObject = await makeItemForGoogleSheet(
        firstItemsRequest.GetSellerListResponse.ItemArray.Item[index]
      );
     
    //   await googleSheets.spreadsheets.values.append({
    //     auth,
    //     spreadsheetId,
    //     range: googleSpreadSheetName,
    //     valueInputOption: "USER_ENTERED",
    //     resource: {
    //       values: [ EbayItemsObject],
    //     },
    // });
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

      // for (
      //   let index = 0;
      //   index < paginatedItems.GetSellerListResponse.ReturnedItemCountActual;
      //   index++
      // ) {
      //   const EbayItemsObject = await makeItemForGoogleSheet(
      //     firstItemsRequest.GetSellerListResponse.ItemArray.Item[index]
      //   );
      //   let itemsForGoogle = [];
  
      //   EbayItemsObject.forEach(async (item) => {
      //     const itemForSheet = [item]
      //     itemsForGoogle.push(itemForSheet);
      //   });
      //   await googleSheets.spreadsheets.values.append({
      //     auth,
      //     spreadsheetId,
      //     range: googleSpreadSheetName,
      //     valueInputOption: "USER_ENTERED",
      //     resource: {
      //       values: [...itemsForGoogle],
      //     },
      //   });
      // }
    }
    return
    // const auth = new google.auth.GoogleAuth({
    //   keyFile: "credentials.json",
    //   scopes: "https://www.googleapis.com/auth/spreadsheets",
    // });
    // const client = await auth.getClient();
    // const googleSheets = google.sheets({ version: "v4", auth: client });

    // // clear all sheet before adding new values
    // await googleSheets.spreadsheets.values.clear({
    //   auth,
    //   spreadsheetId,
    //   range: googleSpreadSheetName,
    // });

    const shopifyItemsObject = await getItemsFromShopify();
    //let itemsForGoogle = [];

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
      //let itemsForGoogle = [];

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
         // updateProducStatus(activeProduct.id, "archived");
          return;
        }
      } catch (error) {
        res.send(`something happened in sold_items_in_archive: ${error}`);
      }
    });
  });

  //res.redirect("/make_google_sheet");
});

app.listen(PORT, () => {
  console.log(`App listening port ${PORT}`);
});
