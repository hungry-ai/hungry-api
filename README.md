# hungry-api

Checklist of all the important code in order of importance:

- `server.js`: the main code for running the server
- `config.env`: all our secret passwords
- `routes/instagram.js`: server endpoint definitions
- `services/hungryai.js`: library functions for all the main app logic
- `models`: definitions of all the objects we store in Mongo
- `services/google.js`: any code that calls Google APIs
- `services/instagram.js`: any code that calls Instagram APIs
- `services/recommender.js`: implementation of our recommender algorithm, i.e. how to predict ratings and how to update weights when we get new reviews

## `server.js`

The Hungry AI server is basically a while loop that waits around for people to send get/put requests and figures out how to respond to them. This while loop runs on some computer owned by [Railway](https://railway.app) that we pay to use. You can start this while loop by saying `node server.js`. The act of sending our code to Railway and telling them to run `node server.js` is called *deployment*, and Railway automatically deploys our server every time there is a push to main so be super careful when you push to main or merge in a pull request.

The `server.js` file itself isn't too interesting, it just sets everything up. It probably won't change that much.

## `config.env`

This file contains all our secret passwords and as such **SHOULD NEVER BE COMMITTED TO GITHUB**! Mainly our Mongo, Instagram, and Google passwords. In `server.js` we load this package called [dotenv](https://www.npmjs.com/package/dotenv) which automatically turns these into `process.env` variables. So if you ever need to add a new password, add a line to `config.env` saying `MY_PASSWORD=asdf1234` and then say `process.env.MY_PASSWORD` from your code.

To put these passwords into Railway, click on the Variables tab and insert them there. Careful, because updating a Variable also redeploys the server.

## `routes/instagram.js`

This file contains all the endpoints of the server, meaning the URLs where you perform get/post requests. These are [Express](https://expressjs.com/) objects that take two arguments: (1) the URL of where to get/post (2) what function to call when you get one of those requests.

Server functions take in two arguments `(req, res)` and don't return anything. `req` contains the info supplied to the request, for instance if I do a get request for all stories by balconycarspotting then `req = {body: {instagramUsername: balconycarspotting}}`. `res` is where you send the resulting data to. So most server functions look like:

```
instagramRoutes.route("/instagram/wherever").get((req, res) => {
    const something = req.body.something;
    hungryai.doSomething(something).then(results => {
        res.send(results);
    }).catch(error => {
        res.send(valueIfFailed)
    })
})
```

One interesting endpoint is `/instagram/story-mention`. Basically Instagram sends us a notification every time we get mentioned in someone's story.

## `services/hungryai.js`

This file contains all the library functions called by `routes/instagram.js`. Mainly `storyMention`, `getStories`, `getReviews`, and `getRecommendations` but you can see everything it exposes by looking in the `module.exports`. This file is intended to be pretty lightweight, just making calls to the various functions in `services/google.js+instagram.js+recommender.js` as well as some Mongo calls.

### asyncs

Pay close attention to all the uses of the `async` keyword. The motivation for asyncs is that when we get a request, we don't want to have to block the server and wait until that request is finished before we can start the next request. asyncs allow you to spawn a process in a separate thread in the background so the server is never clogged up.

Unfortunately, asyncs require some extra work because you have to think in a completely different paradigm. Instead of returning a value, an async function returns a *promise*. You can only access the result of that promise by calling the `.then()` callback. So instead of saying:

```
user = getUser();
console.log(user.name);
```

you have to say:

```
getUser().then(user => {
    console.log(user.name);
})
```

Another thing when dealing with promises is error handling. Instead of saying try/catch, you have to use the `.catch()` callback. So it may look like this:

```
getUser().then(user => {
    console.log(user.name);
}).catch(error => {
    console.log(`failed`);
})
```

The last annoying thing about promises is `Promise.all`. When you want to run multiple promises in parallel, you can say `Promise.all` on an array of promises. For instance,

```
Promise.all([getUser(username), getImage(url)])
    .then(([user, image]) => {
        console.log(`${user} reviewed ${image}`)
    })
```

Sometimes you'll see `Promise.allSettled`. `Promise.all` will immediately kill the entire array of promises if any single one of them raises an exception. `Promise.allSettled` will wait for them to finish, so it's useful when you want to execute all the promises anyways even if one of them bugs out.

## `models`

We use [mongoose](https://mongoosejs.com/docs/) to read/write to our Mongo databases. It's a very convenient package - you just define what your Mongo objects will look like in the `models` folder and just automatically knows how to set things up in Mongo. Look at any of the models files to see what fields it has.

The main mongoose functions we use are `.save()`, `.findOne()`, and `.find()`. To save something to a database say

```
user = new User({username: "cody"});
user.save();
```

which returns a promise that will return a user. To look up one row in the database based on a certain criteria, say

```
User.findOne({username: "cody"}).then(user => {
    console.log(`${user}`)
});
```

Be careful because if Mongo can't find any row in the database matching your criteria, it will return `undefined`, which is why you may see something like:

```
User.findOne({username: "cody"}).then(user => user ? user : addUser("cody"));
```

which means if `user` is undefined then it'll add a new user instead.

Data is perhaps the most important part of the entire server. This is why every time we get a new piece of data, the very first thing we do is save it raw before we do anything with it. For instance:

- Instagram webhooks. If we lose them then that person's review is lost forever.
- Google tags. We pay each time we tag an image, so if we don't save it then we may have to re-tag the same image multiple times.
- Google restaurants + restaurant images. We pay each time we ask Google all the restaurants with a zip code or for that restaurant's images.

## `services/google.js`

Here we keep all the calls to Google APIs, mainly:

- [Google Cloud Vision label detection](https://cloud.google.com/vision/docs/labels): giving Google an image url and getting back the tags it matches + how strong of a match
- [Google Places nearby search](https://developers.google.com/maps/documentation/places/web-service/search-nearby): giving Google a longitude/latitude and radius and getting back a list of restaurants in that area (limited to 60 restaurants)
- [Google Places place photos](https://developers.google.com/maps/documentation/places/web-service/photos): giving Google a `place_id` and getting back the images associated with that place

Each of these costs money, but not that much so don't sweat it. Something like $1 per 1000 photos for tagging and $25 per 1000 restaurants. We try to keep costs down by storing the results of API calls in Mongo, which is why you may see code like:

```
Image.findOne({url: url}).then(image =>
    image ? image
        : getImageTags(url).then(tags =>
            new Image({url: url, tags: tags}).save()
        )
    )
```

## `services/instagram.js`

Here we keep all the calls to Instagram APIs, mainly:

- Parsing [story mentions](https://developers.facebook.com/docs/messenger-platform/instagram/features/story-mention/): every time someone mentions us in their story, Instagram sends us a json containing the info in that story
- Getting [conversations](https://developers.facebook.com/docs/messenger-platform/conversations/): every time someone mentions us in their story, a copy of that story mention is sent to our inbox in Instagram, so we can use that to retrieve all story mentions from a specific user. However, these stories disappear after 24 hours, so it's pretty unreliable. Unfortunately, it violates Instagram's terms of service to save peoples' stories so all we can do is get those image tags from Google and save those :(
- Looking up someone's Instagram username from their Instagram ID: the story mention webhooks unfortunately only contain the sender's Instagram ID, so we need to do a lookup to get that person's Instagram username

You can use the Facebook [Graph API Explorer](https://developers.facebook.com/tools/explorer/) to work on API calls. Also our app is connected to Instagram on their [app dashboard](https://developers.facebook.com/apps/681533887105755/dashboard/?business_id=921628852196938). In order to use certain features from Facebook, we need to submit an app review to them to prove we're using user data properly and we're not scam bots.

## `services/recommender.js`

Our recommender algorithm involves giving each user and image a vector of $d\approx20$ weights. To predict someone's rating of an image, just take the dot product of their weights:

\[prediction(user, image)=\sum_{i=1}^{d}user.weights_i*image.weights_i\]

The weights of an image never change and are computed by the following algorithm. First, we ask Google for all the tags that the image matches. Then, each of these tags is associated with a $d$-dimensional vector that we have already trained in our database. Then the image's weights is just the average of all of those tag weights, weighted by how strongly that tag matches to the image:

\[image.weights=\frac{\sum_{t\in tags}t.weights*pr\_match(t)}{\sum_{t\in tags}pr\_match(t)}\]

The user weights are the solution to a least squares equation and have the form

\[user.weights=(X^\top X)^{-1}X^\top y\]

Our implementation maintains each user's $X^\top X$ and $X^\top y$. If your user reviews a new image and gives it a rating, then your update is:

\[X^\top X\to X^\top X+rating*image.weights*image.weights^\top\]

\[X^\top y\to X^\top y+rating*image.weights\]

The final implementation detail is that since inverting a matrix is expensive, we use lazy computation to avoid having to re-invert each time. So $user.weights$ has a flag called `stale` which says whether or not you need to invert the matrix.
