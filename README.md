# dom
An extension to `xmldom`'s JavaScript implementation of W3C DOM. Most notably `getAllNodesByPath` and `getNodeByPath` are to be used in a manner similar to `querySelectorAll` and `querySelector`. Also provides syntactic sugar through a set of chainable functions.


## API

### `get(path)`

`path`: a selector or set of selectors used to filter nodes

* `.all()`: get all nodes
* `.previous()`: get a or all previous nodes
* `.next()`: get a or all next nodes
* `.until(otherNode)`: get all previous or next nodes until another node

`.from(node)`: starting from this node


### `set(attributes)`

`attributes`: an object of properties to set on the node

`.on(node)`: the node to set the attributes on


### `append(node)`

`node`: a node or array of nodes to append

`.to(otherNode)`: the parent node to append the child node(s) to


### `create(nodeName)`

`nodeName`: the type of node to create

* `.withAttributes(attributes)`: an object of properties to set on the created node
* `.andAttributes(attributes)`: an alias for `withAttributes()`
* `.withChildren(childNode)`: a node or array of nodes to append to the created node
* `.andChildren(childNode)`: an alias for `withChildren()`

`.for(document)`: the DOM to create the node within


### `insert(node)`

`node`: the node to insert

`.before(otherNode)`: the node to follow the inserted node

`.after(otherNode)`: the node to precede the inserted node


### `remove(node)`

`node`: the node to remove
