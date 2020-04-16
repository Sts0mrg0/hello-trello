require('dotenv').config();
const {
  TRELLO_BOARD_ID,
  TRELLO_DEV_TOKEN,
  TRELLO_KEY,
  ELEVENTY_ENV,
  BRANCH } = process.env;

const fs = require("fs");
const Trello = require("trello");
const trello = new Trello(TRELLO_KEY, TRELLO_DEV_TOKEN);
const localDataFile = __dirname + '/local/trello.json';

module.exports = () => {

  // don't keep hitting the API during local dev
  if(ELEVENTY_ENV == 'dev') {
    return require(localDataFile);
  }

  return trello.getListsOnBoard(TRELLO_BOARD_ID)
    .then((lists) => {
      // make and index of list ids
      // we can reference by branch name
      var listKeys = {};
      lists.forEach(list => {
        listKeys[list.name.toLowerCase()] = list.id;
      })

      // get the cards from the list which corresponds
      // to the branch this is running on.
      let listId = listKeys[BRANCH] || listKeys['live'];
      // let listId = listKeys['stage'] || listKeys['live'];

      console.log('LIST ID :', listId);
      console.log('FOR BRANCH :', BRANCH);

      return trello.getCardsOnList(listId)
        .then(cards => {
          // If we ran the seed script, let's stach this data for use during
          // local development. Just to save our API quotas.
          if(ELEVENTY_ENV == 'seed') {
            fs.writeFile(localDataFile, JSON.stringify(cards), err => {
              if(err) {
                console.log(err);
              } else {
                console.log(`Data saved locally for dev: ${localDataFile}`);
              }
            });
          }
          return cards;
        })
    });
}
