```eval $(cat .env) node_modules/nodemon/bin/nodemon.js server.js```
```db.getCollection('stuff').find({})```
```db.getCollection('stuff').updateOne({filename:"10th.png"}, {$set: {tags: ["a", "q", "d"]}})```
