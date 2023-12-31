import express, { urlencoded } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app =express()
app.use(cors())
app.use(express.json({limit:'16kb'}))
app.use(urlencoded({extended:true}))
app.use(express.static('public'))
app.use(cookieParser())

//route import
import userRouter from './routes/user.route.js'

//declare route

app.use('/api/v1/users',userRouter)

export default app