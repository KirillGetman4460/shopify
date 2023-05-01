const { vendors } = require("./constants");

function makeShippingTag(shipPrice) {
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

function addVendor(title) {
  const titleLowerCase = title.toLowerCase();
  const titleWords = titleLowerCase.split(" ");
  let vendor = "";
  vendors.forEach((vendorFromArr) => {
    const vendorFromArrLowerCase = vendorFromArr.toLowerCase();
    if (titleWords.includes(vendorFromArrLowerCase)) vendor = vendorFromArr;
  });

  return vendor;
}


function makeImagesArr(item) {
  const imagesArray = [];

  if (Array.isArray(item.PictureDetails.PictureURL)) {
    item.PictureDetails.PictureURL.forEach((img) =>
      imagesArray.push({
        src: img,
      })
    );
  } else {
    imagesArray.push({ src: item.PictureDetails.PictureURL });
  }

  return imagesArray;
}

function makeItemObject({ item, method, itemHandle }) {
  let itemToPush;

  switch (method) {
    case "REDO":
      itemToPush = { ...item };
      break;
    case "POST":  
      const imagesArray = makeImagesArr(item);

      let shippingTag = "";
      if (Array.isArray(item?.ShippingDetails?.ShippingServiceOptions))
        shippingTag = makeShippingTag(
          item?.ShippingDetails?.ShippingServiceOptions[0]?.ShippingServiceCost
        );
      else
        shippingTag = makeShippingTag(
          item?.ShippingDetails?.ShippingServiceOptions?.ShippingServiceCost
        );

      const findVendor = addVendor(item.Title);

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
              grams: ShippingPackageDetails.WeightMajor || 0
            },
          ],

          images: imagesArray,
        },
      };
      break;

    case "PUT":
      itemToPush = {
        product: {
          status: Number(item.Quantity) === 0 ? "archived" : "active",
          tags: shippingTag,
          variants: [
            {
              inventory_quantity: item.Quantity,
              price: item.SellingStatus.CurrentPrice,
              sku: item.SKU,
              grams: ShippingPackageDetails.WeightMajor || 0
            },
          ],
        },
      };
      break;
  }

  return itemToPush;
}
function makeItemForGoogleSheet(item) {
  //const findVendor = addVendor(item.Title);
  //const imagesArray = makeImagesArr(item);
  return [
    item.Title,

  ];
}
module.exports = {
  addVendor,
  makeShippingTag,
  makeItemForGoogleSheet,
  makeItemObject,
};
