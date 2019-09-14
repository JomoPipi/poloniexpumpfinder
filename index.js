const puppeteer = require('puppeteer')
const nodemailer = require('nodemailer')
const fs = require('fs') 
var page

// function delay(timeout) {
//     return new Promise((resolve) => {
//       setTimeout(resolve, timeout);
//     });
// }

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: '<email>'
      pass: '<password>'
    }
});

(async () => { 'SETUP FUNCTION'
  
    const browserOptions = {
        headless: true, // false,
        // slowMo: 500,
        args: [`--window-size=1600,900`],
        defaultViewport: { width: 1600, height: 900 }
    }
    const browser = await puppeteer.launch(browserOptions)
    page = await browser.newPage();
    let repeat = 0
    do {
        try {
            await page.goto('https://poloniex.com/exchange#btc_doge')
        } catch (error) {
            console.log('error occurred trying to access poloniex')
            repeat = 1
        }
    } while (repeat)
    console.log('we are now on poloniex.com')
})()

const coins = ('atom,bat,bchabc,bchsv,bnt,bts,clam,cvc,dash,dgb,doge,eos,' +
'etc,eth,fct,foam,gnt,grin,knc,lbc,loom,lpt,ltc,maid,mana,nav,nmr,omg,' +
'pasc,poly,qtum,sc,snt,steem,storj,str,strat,via,vtc,xem,xmr,xpm,xrp,zec,zrx').split`,`

setInterval(
async () => {

    const lastPrices = JSON.parse(fs.readFileSync('coindata.json', 'utf8'))
    const bigChanges = [], bigChange = 3, coindata = {}
    
    for (const c of coins) {
        const text = await page.$eval('#marketRowbtc_' + c, e => e.innerHTML)
        let price = text.slice(text.indexOf('"price">')+8)
        price = +price.slice(0,price.indexOf('<'))
        const sats = Math.round(price * 1e8), 
        percentChange = (sats / lastPrices[c].lastPrice - 1) * 100
        if (percentChange > bigChange || percentChange < -bigChange) bigChanges.push([c,percentChange,sats])
        coindata[c] = { lastPrice: sats }
        // console.log(
        //     // `${c} price:`, sats, 'satoshi', 
        //     `${c} change:`,
        // percentChange, '%')
    }

    fs.writeFileSync('coindata.json', JSON.stringify(coindata))
    // await page.screenshot({path: 'poloniex.png'})

    if (bigChanges.length) {
        console.log('bigChanges =',bigChanges)
        let text = ''
        for (const [coin, percentChange, sats] of bigChanges) {
            text += `
            ${coin} has just ${percentChange < 0 ? 'decreased' : 'increased'} by ${Math.abs(percentChange.toFixed(2))} percent within the last minute, on poloniex.
            It is now worth ${sats} satoshi.
            `
            console.log(text)
        }
            
        var mailOptions = {
            from: '<email>',
            to: '<email>',
            subject: 'Poloniex pump notifier',
            text: text
        };
    
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
            console.log(error);
            } else {
            console.log('Email sent: ' + info.response);
            }
        });
    }
    console.log('bigChanges.length =',bigChanges.length)
},
    
1000 * 60) // every minute

// await browser.close();