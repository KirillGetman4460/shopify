const { vendors } = require("./constants");

const makeShippingTag = (shipPrice) => {
  let shipTag = "";
  switch (true) {
    case shipPrice <= 0:
      shipTag = "";
      break;
    case shipPrice <= 5:
      shipTag = "5.00";
      break;
    case shipPrice <= 8:
      shipTag = "8.00";
      break;
    case shipPrice <= 10:
      shipTag = "10.00";
      break;
    case shipPrice <= 15:
      shipTag = "15.00";
      break;
    case shipPrice <= 20:
      shipTag = "20.00";
      break;
    case shipPrice <= 25:
      shipTag = "25.00";
      break;
    case shipPrice <= 35:
      shipTag = "35.00";
      break;
    case shipPrice <= 50:
      shipTag = "50.00";
      break;
    case shipPrice <= 99:
      shipTag = "99.00";
      break;
    case shipPrice <= 120:
      shipTag = "120.00";
      break;
    case shipPrice <= 250:
      shipTag = "250.00";
      break;
    case shipPrice <= 300:
      shipTag = "300.00";
      break;
    case shipPrice <= 350:
      shipTag = "350.00";
      break;
    case shipPrice <= 400:
      shipTag = "400.00";
      break;
    case shipPrice <= 450:
      shipTag = "450.00";
      break;
    case shipPrice <= 500:
      shipTag = "500.00";
      break;
  }

  if (shipTag) return "ship" + shipTag;
  return shipTag;
}

const addVendor = (title) => {
  const titleLowerCase = title.toLowerCase();
  const titleWords = titleLowerCase.split(" ");
  let vendor = "";
  vendors.forEach((vendorFromArr) => {
    const vendorFromArrLowerCase = vendorFromArr.toLowerCase();
    if (titleWords.includes(vendorFromArrLowerCase)) vendor = vendorFromArr;
  });

  return vendor;
}


const makeImagesArr = (item) => {
  const imagesArray = [];
  if (Array.isArray(item.PictureDetails.PictureURL)) {
    item.PictureDetails.PictureURL.forEach((img) =>
      imagesArray.push({
        src: img.replace('$_12', '$_10'),
      })
    );
  } else {
    imagesArray.push({ src: item.PictureDetails.PictureURL });
  }

  return imagesArray;
}

const makeItemObject = ({ item, method, itemHandle }) => {
  let itemToPush;
  let shippingTag = "";
  const imagesArray = makeImagesArr(item);
  const findVendor = addVendor(item.Title);
  switch (method) {
    case "REDO":
      itemToPush = { ...item };
      break;
    case "POST":  
 
      if (Array.isArray(item?.ShippingDetails?.ShippingServiceOptions))
        shippingTag = makeShippingTag(
          item?.ShippingDetails?.ShippingServiceOptions[0]?.ShippingServiceCost
        );
      else
        shippingTag = makeShippingTag(
          item?.ShippingDetails?.ShippingServiceOptions?.ShippingServiceCost
        );

      itemToPush = {
        product: {
          title: item.Title,
          body_html: item.ConditionDescription || "description placeholder",
          status: Number(item.Quantity) === 0 ? "archived" : "active",
          handle: itemHandle,
          tags: shippingTag,
          vendor: findVendor || " ",
          published_scope: "web",

          variants: [
            {
              inventory_management: "shopify",
              inventory_quantity: item.Quantity,
              price: item.SellingStatus.CurrentPrice,
              sku: item.SKU,
              //grams: item.ShippingPackageDetails.WeightMajor || 0
            },
          ],

          images: imagesArray,
        },
      };
      break;

    case "PUT": 
        if (Array.isArray(item?.ShippingDetails?.ShippingServiceOptions))
        shippingTag = makeShippingTag(
          item?.ShippingDetails?.ShippingServiceOptions[0]?.ShippingServiceCost
        );
        else
        shippingTag = makeShippingTag(
          item?.ShippingDetails?.ShippingServiceOptions?.ShippingServiceCost
        );  
      itemToPush = {
        product: {
          status: Number(item.Quantity) === 0 ? "archived" : "active",
          tags: shippingTag,
          variants: [
            {
              inventory_quantity: item.Quantity,
              price: item.SellingStatus.CurrentPrice,
              sku: item.SKU,
              //grams: item.ShippingPackageDetails.WeightMajor || 0
            },
          ],
          images: imagesArray,
        },
        
      };
      
      break;
  }

  return itemToPush;
}
const makeItemForGoogleSheet = (item) => {
  const imagesUrl = Array.isArray(item.PictureDetails?.PictureURL) ? item.PictureDetails?.PictureURL.map(url => url.replace('$_12', '$_10')): [];
  const ItemArray =  [
    item.ItemID,
    item.Title,
    item.SKU,
    item.ConditionDescription,
    item.SellingStatus.CurrentPrice,
    item.ShipToLocations,
    item.Quantity,
    item.ShippingDetails.ShippingServiceOptions.ShippingServiceCost,
    item.SellingStatus.ListingStatus,
  ];
  return ItemArray.concat(imagesUrl)
}
module.exports = {
  addVendor,
  makeShippingTag,
  makeItemForGoogleSheet,
  makeItemObject,
};
