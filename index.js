const express = require('express');
const app = express();
const GoogleImages = require('google-images');
require('dotenv').config();
const client = new GoogleImages(process.env.ENGINE_API, process.env.SEARCH_API);

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ds163561.mlab.com:63561/latestsearches`);
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("connection with db established");
});
var noteSchema = mongoose.Schema({
    searchString: String,
    date: Date

});

var Note = mongoose.model('Note', noteSchema);

app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
    res.end('use this api to search for images      /api/imagesearch/:call \n' +
        'and this to look history of searches   /api/latest/imagesearch/');
})

app.get('/api/imagesearch/:call', function (req, res) {
    console.log(req.query);
    console.log(req.params.call);
    const request = `${req.params.call}${req.query.offset ? '?offset=' + req.query.offset : ''}`;
    var noteToDb = new Note({ searchString: req.params.call, date: new Date() });
    noteToDb.save(function (err, noteToDb) {
        if (err) return console.error(err);
    });
    client.search(request)
        .then(images => {
            const responseArray = images.map(item => {return {url: item.url,
                context: item.parentPage,
                thumbnail: item.thumbnail.url,
                snippet: item.description}});

            res.end(JSON.stringify(responseArray));
    });
});
app.get('/api/latest/imagesearch/', function (req, res) {
    Note.find({}).then(notes =>
    {
        const responseString = notes.map(note => {return {searchedString: note.searchString, date: note.date}});
        res.end(JSON.stringify(responseString));
    }).catch(err =>console.log(err));
})

app.listen(app.get('port'), function (err) {
    if(err) return console.log(err);
    console.log('app listening on port ' + app.get('port'));
})