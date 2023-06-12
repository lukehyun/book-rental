const express = require('express')
const app = express()
const port = 3000

let VIDEO = class {
    constructor(ID, name, director) {
      this.ID = -1;
      this.name = name;
      this.direc = director
      this.bor = false;
    }
}
  
  let GUEST = class {
    constructor(name, addr) {
      this.ID = -1;
      this.name = name;
      this.addr = addr
      this.list = []
    }
}

app.get('/', (req, res) => {
})

app.listen(port, () => {
})