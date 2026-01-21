const express=require('express')
const app=express()
app.listen(7777,()=>{
    console.log('app is running on port 7777')
})
app.use('/hello/world',(req,res)=>{
    res.send('hello world')
})
app.use('/hello',(req,res)=>{
    res.send('hello')
})

app.use('/test',(req,res)=>{
    res.send('sfew')
})

app.use('/',(req,res)=>{
    res.send([
        {name:'india'},
        {name:'deepak'}

    ])
})
