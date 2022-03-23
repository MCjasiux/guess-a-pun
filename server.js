const express = require("express")
const app = express()
const PORT = 3000;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const path = require("path")
const bodyParser = require("body-parser")
const { engine } = require('express-handlebars');
var axios = require("axios").default;

const http = require("http")

app.engine('hbs', engine({ extname: 'handlebars', defaultLayout: 'main.hbs' }))
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views')); // ustalamy katalog views
app.set('view engine', 'hbs'); // określenie silnika szablonów
app.use(express.static(path.join(__dirname, 'static')));

app.get("/", function (req, res) {
    res.render('index.hbs')
    // res.sendFile(path.join((__dirname + "\\index.html")))
})
app.get("/pun", function (req, res) {
    let fullJoke
    //console.log(req)
    let queryOptions = ""
    axios.get("https://api.genderize.io/?name=" + req.params.name)
        .then(function (response) {
            if (response.status == 200) {
                if (response.data.probability > .9 && response.data.gender == "female") {
                    queryOptions = "&blacklistFlags=nsfw,racist,sexist,explicit"
                } else if (response.data.gender == "female") {
                    queryOptions = "&blacklistFlags=racist,sexist"
                } else {

                }
                axios.get("https://v2.jokeapi.dev/joke/Pun?type=twopart" + queryOptions)
                    .then(function (response) {
                        //console.log(response.data)
                        if (response.status == 200) {


                            Promise.all([translate(response.data.setup), translate(response.data.delivery)])
                                .then(function (results) {
                                    const translatedSetup = results[0].data.translatedText;
                                    const translatedDelivery = results[1].data.translatedText;
                                    if (results[0].status == 200 && results[1].status == 200) {
                                        res.render("pun.hbs", {
                                            "setup": response.data.setup,
                                            "delivery": response.data.delivery,
                                            "translatedSetup": translatedSetup,
                                            "translatedDelivery": translatedDelivery
                                        })
                                    } else {
                                        res.render("error.hbs", { code: response.status, reason: "Translation failed" })
                                    }
                                })
                                .catch(function (error) {
                                    res.render("error.hbs", { code: 500, "reason": "Error while trying to translate" })
                                })
                        } else {
                            res.render("error.hbs", { code: response.status, "reason": "Failed to fetch a joke" })
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                        res.status(500).send(error)
                        res.render("error.hbs", { code: 500, "reason": "Error while trying to fetch a joke" })

                    })
            }else{
                res.render("error.hbs", { code: response.status, "reason": "Failed to predict gender" })
            }
        }).catch(function (error) {
            res.render("error.hbs", { code: 500, "reason": "Error while predicting name" })
        })


})

async function translate(text) {
    return axios.post("https://translate.api.skitzen.com/translate", { "q": text, "source": "en", "target": "pl", "format": "text" })
}
app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})