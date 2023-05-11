require("dotenv").config();
const { XMLParser } = require("fast-xml-parser");
const axios = require("axios");
const parser = new XMLParser();
const parse_link = require("parse-link-header");

const { makeItemObject } = require("./helpers");
const { shopifyConfig, shopifyGetItemsLimit } = require("./constants");

async function getAccessWithRefreshEbay(refresh_token) {
  try {
    const getAccessWithRefreshEbayConfig = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic VGVzdDFUZXMtdGVzdGFwcC1QUkQtZDA4YzQ5NjQwLWUwMDE4OWIzOlBSRC0wOGM0OTY0MGFiODAtZGExYS00NzBjLWFhOTctNTMyMw==",
      },
    };

    const body = {
      grant_type: "refresh_token",
      refresh_token,
    };

    const response = await axios.post(
      "https://api.ebay.com/identity/v1/oauth2/token",
      body,
      getAccessWithRefreshEbayConfig
    );

    const { access_token } = response.data;

    return access_token;
  } catch (error) {
    console.log("something happened in getAccessWithRefreshEbay", error);
  }
}

async function getSellerList({ EndTimeFrom, EndTimeTo, page, access_token }) {
  try {
    const xmlEbayGetSellerList = `<?xml version="1.0" encoding="utf-8"?>
  <GetSellerListRequest xmlns="urn:ebay:apis:eBLBaseComponents">
    <ErrorLanguage>en_US</ErrorLanguage>
    <WarningLevel>High</WarningLevel>
    <IncludeWatchCount>true</IncludeWatchCount> 
    <EndTimeFrom>${EndTimeFrom}</EndTimeFrom> 
    <EndTimeTo>${EndTimeTo}</EndTimeTo> 
    <GranularityLevel>Fine</GranularityLevel> 
     <Pagination>
      <EntriesPerPage>200</EntriesPerPage>
      <PageNumber>${page}</PageNumber>
    </Pagination>
  </GetSellerListRequest>`;

    const getSellerListConfig = {
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "X-EBAY-API-IAF-TOKEN": access_token,
        "X-EBAY-API-CALL-NAME": "GetSellerList",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1085",
        Host: "api.ebay.com",
      },
    };

    const response = await axios.post(
      "https://api.ebay.com/ws/api.dll",
      xmlEbayGetSellerList,
      getSellerListConfig
    );

    const responseParsed = await parser.parse(response.data);

    console.log(responseParsed);

    return responseParsed;
  } catch (error) {
    console.log("something happened in getSellerList", error);
  }
}

async function postItemInShopify(item) {
  try {
    let itemHandle = "";

    if (item.redoItem === true) itemHandle = "e" + item.product.id;
    else itemHandle = "e" + item.ItemID;

    // console.log(item.ItemID);
    const shopifyGetItemByHandleConfig = {
      ...shopifyConfig,
      params: { handle: itemHandle },
    };

    const itemFromShopify = await axios.get(
      `https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-01/products.json`,
      shopifyGetItemByHandleConfig
    );

    if (itemFromShopify.data.products.length) {
      // update item
      let itemToPush;
      if (item.redoItem === true)
        itemToPush = makeItemObject({ item, method: "REDO" });
      else itemToPush = makeItemObject({ item, method: "PUT" });
      
      const product_id = itemFromShopify.data.products[0].id;

      await axios.put(
        `https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-01/products/${product_id}.json`,
        itemToPush,
        shopifyConfig
      )
    } else {
      // create new item

      let itemToPush;
      if (item.redoItem === true)
        itemToPush = makeItemObject({ item, method: "REDO" });
      else itemToPush = makeItemObject({ item, method: "POST", itemHandle });

      await axios.post(
        `https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-01/products.json`,
        itemToPush,
        shopifyConfig
      );
    }
  } catch (error) {
    const item = error?.config?.data;
    if (item) {
      const itemParsed = JSON.parse(error?.config?.data);
      itemParsed.redoItem = true;
      postItemInShopify(itemParsed);
    } else {
      console.log("something happened in postItemInShopify", error);
    }
  }
}

async function getItemsFromShopify(nextPage) {
  try {
    const shopifyGetItemsConfig = {
      ...shopifyConfig,
      params: {
        limit: shopifyGetItemsLimit,
        ...(nextPage && { page_info: nextPage }),
      },
    };

    const response = await axios.get(
      `https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-01/products.json`,
      shopifyGetItemsConfig
    );
    const parsedLink = parse_link(response.headers.link);

    return { data: response.data.products, link: parsedLink };
  } catch (error) {
    console.log("something happened in getItemsFromShopify", error);
  }
}

const updateProducStatus = async(idProduct, newStatus) =>{
  try {
    await axios.put( `https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-01/products/${idProduct}.json`,{
      product:{
        status: newStatus
      }
    },shopifyConfig)
  } catch (error) {
    console.log("something happened in updateProducStatus", error);
  }
}

const getAllProducts = async() =>{
  try {
    const {data} = await axios.get(`https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-01/products.json?status=active`,shopifyConfig)
    return data.products
  } catch (error) {
    console.log("something happened in getAllProducts", error);
  }
}

const removeProductById = async(id) =>{
  try {
    const {data} = await axios.get(`https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-01/${id}.json`,shopifyConfig)
    return data.products
  } catch (error) {
    console.log("something happened in removeProductById", error);
  }
}

const getAllSoldProducts = async() =>{
  try {
    const {data} = await axios.get(`https://${process.env.SHOPIFY_SHOP_URL}/admin/api/2023-01/orders.json?status=any&fields=line_items`,shopifyConfig)
    return data.orders
  } catch (error) {
    console.log("something happened in getAllSoldProducts", error);
  }
}

module.exports = {
  getAccessWithRefreshEbay,
  getSellerList,
  postItemInShopify,
  getItemsFromShopify,
  getAllProducts,
  getAllSoldProducts,
  updateProducStatus,
  removeProductById
};