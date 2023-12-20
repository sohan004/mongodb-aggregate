const express = require('express');
const cors = require('cors');
const { default: mongoose, Schema } = require('mongoose');
const { ObjectId } = require('mongodb');
const app = express()
const port = 3000
const autopopulate = require('mongoose-autopopulate');

app.use(cors())
app.use(express.json())
mongoose.plugin(autopopulate)

const dbConnect = (dbName) => {
    const db = mongoose.createConnection(`mongodb://localhost:27017/${dbName}`)
        .on('connected', () => {
            console.log(`${dbName} database connected`);
        })
        .on('error', () => {
            console.log(`${dbName} database not connected`);
        })

    return db

}

const user_DB = dbConnect('userDB')
const media_DB = dbConnect('mediaDB')

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
}, {
    timestamps: true
})

userSchema.plugin(autopopulate)

const mediaSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    mediaPath: { type: String, required: true },
}, {
    timestamps: true
})



const User = user_DB.model('User', userSchema)
const Media = user_DB.model('Media', mediaSchema)


app.get('/', async (req, res) => {
    res.send('server running')
})

app.post('/user', async (req, res) => {
    const user = await new User({
        userName: 'nohan',
        email: 'xyz@gmail.com'
    })
    user.save()
    res.send({ user: user })
})

app.post('/media', async (req, res) => {
    const media = await new Media({
        // userId: new ObjectId('65832385419382a106007408'),
        mediaPath: 'asdfa.png'
    })
    media.save()
    res.send({ media: media })
})

app.get('/media', async (req, res) => {
    try {
        const media = await User.aggregate([
            {
                $lookup: {
                    from: 'media', // Name of the Media collection
                    let: { user_id: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$userId', '$$user_id'] },
                                        { $eq: ['$privacy', 'public'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'userMedia'
                }
            },
            {
                $project: {
                    userName: 1,
                    email: 1,
                    userMedia: 1,
                }
            }
        ])
        res.send({ media: media })
    } catch (error) {
        console.log(error);
    }
})


app.listen(port, () => {
    console.log(`server run ${port} port`)
})