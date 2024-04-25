
require('dotenv').config()
const mongoose = require('mongoose')
const MONGODB_URI  = "mongodb://imadjs:imadjs@ac-vtggtkp-shard-00-00.emjqjq7.mongodb.net:27017,ac-vtggtkp-shard-00-01.emjqjq7.mongodb.net:27017,ac-vtggtkp-shard-00-02.emjqjq7.mongodb.net:27017/codeimad?ssl=true&replicaSet=atlas-p9rojv-shard-0&authSource=admin&retryWrites=true&w=majority"
     

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('MongoDB connection SUCCESS')
  } catch (error) {
    console.error('MongoDB connection FAIL')
    process.exit(1)
  }
}

connectDB();