# Define requests

To explore some functionnalities, we will take the blog example.

First you must define de posts :

```js
  var posts = session.declare('post', {
    properties: {
      title: 'string',
      body: 'string',
      online: 'boolean',
      author: {
        is: 'user',
        index: true
      }
    },
    views: {
      getOnlineByAuthor: ['author', 'online']
    }
  });
```

As you can see, a post have an author and an online status, 
and we choose to create a view to retrieve authors posts depending their status.

We define now the user :

```js
  var users = session.declare('user', {
    properties: {
      name: 'string',
      email: 'string'
    },
    record: {
      getPosts: function() {
        return posts.findByAuthor(this);
      },
      getOnlinePosts: function() {
        return posts.getOnlineByAuthor(this, true);
      },
      write: function(title, body) {
        return posts.create({
          title: title,
          body: body,
          author: this,
          online: true
        });
      }
    }
  });

```

So we start to write some data, and then retrieve it :

```js
  var john = users.create({
    name: 'John Doe',
    email: 'john@doe.com'
  });
  var post = john.write('hello', 'world');
  
  // we save data
  john.save().then(function() {
    // we save the post
    return post.save();
  }).then(function() {
    // we search john posts
    return john.getOnlinePosts();
  }).then(function(results) {
    // read found posts
    results.each(function(post) {
      console.log('Found ' + post.title + ' : ' + post.body);
    });
  }).done();

```