/* Amplify Params - DO NOT EDIT
	ENV
	FUNCTION_AMPLIFYGETNEWSAPI05E3C7FE_NAME
	REGION
Amplify Params - DO NOT EDIT */

var AWS = require("aws-sdk");
var SQS = new AWS.SQS({ region: "ap-southeast-2" });
const chromium = require("chrome-aws-lambda");

var QUEUE_URL =
  "https://sqs.ap-southeast-2.amazonaws.com/012345678/fetchyomiuri";

exports.handler = async (event) => {
  // TODO implement
  let result = null;
  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    let page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (
        ["image", "stylesheet", "font"].indexOf(request.resourceType()) !== -1
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
    await page.goto("https://www.yomiuri.co.jp/news/");
    await delay(3000);

    const news = await page.evaluate(() => {
      const topNews = [];
      const listOfAllNews = Array.from(
        document.querySelectorAll("div.news-top-latest__list-item__inner h3 a")
      );
      const hrefOfAllNews = Array.from(
        document.querySelectorAll("div.news-top-latest__list-item__inner h3 a")
      );
      const timeOfAllNews = Array.from(
        document.querySelectorAll("div.c-list-date time")
      );
      for (var i = 1; i < 25; i++) {
        const title = listOfAllNews[i].textContent;
        const href = hrefOfAllNews[i].href;
        const time = timeOfAllNews[i].textContent;
        topNews.push({ title, href, time, company: "読売新聞" });
      }
      return topNews;
    });

    var params = {
      MessageBody: JSON.stringify(news),
      QueueUrl: QUEUE_URL,
    };
    console.log(news);
    SQS.sendMessage(params)
      .promise()
      .then((result) => console.log("Successfully sent message", result))
      .catch((error) => console.log("Error failed to send message", error));
    await browser.close();
  } catch (error) {
    return callback(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
  return callback(null, result);
};
