const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const userRouter = require("./routes/userRouter");
const labRouter=require('./routes/labRouter');
const questionRouter=require('./routes/questionRouter')

dotenv.config({ path: ".env" });
app.use(express.json());

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((cons) => {
    // console.log("MongoDb connected successfully Link:");
    console.log("database connected");
  })
  .catch((err) => {
    console.log("Database connection unsuccessful!", err);
  });

app.all("/", (req, res, next) => {
  res.json({
    message: "Hello client",
  });
});

app.use("/user", userRouter);
app.use("/lab", labRouter);
app.use("/question", questionRouter);

app.use((err, req, res, next) => {
  // console.log(err);
  res.status(err.statusCode).json({ message: err.message });
});

const server=app.listen(process.env.PORT, () => {
  console.log(`listening to port no ${process.env.PORT}`);
});


const io=require('socket.io')(server,{
  pingTimeout: 60000,
  cors:{
      origin: 'http://localhost:3000'
  }
});

io.on('connection',(socket)=>{
  console.log("Connected to socket.io")

  socket.on('setup',userData=>{
      socket.join(userData.id);
      console.log('Connected',userData.id)
      socket.emit("connected");
  });
  socket.on('join lab',(lab)=>{
      socket.join(lab)
      console.log('User joined',lab)
  })

  socket.on('new K',({users,user,k})=>{
      users.forEach(u=>{
          if(u.id===user.id) return
          socket.in(u.id).emit('received K',k)
      })
      
  })

  socket.on('Open Dropdown',({val,user,users})=>{
      users.forEach(u=>{
          if(u.id===user.id) return
          socket.in(u.id).emit('dropdown open',{val,user,users})
      })
      
  })
  socket.on('reload',(lab)=>{
      socket.in(lab.id).emit('load')
  })

  socket.on('mouse',({mousePos,user,users})=>{
      users.forEach(u=>{
          if(u.id===user.id) return
          socket.broadcast.emit('mouseback',{mousePos,user:u,users})
      })
  })


  


  socket.off("setup", (userData) => {
      console.log("USER DISCONNECTED");
      socket.leave(userData.id);
    });
});
