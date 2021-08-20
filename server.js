const express=require('express');
const compression=require('compression');
const path = require('path');
const multer =require('multer');
const fs = require('fs')

const app=express();
app.use(compression());
app.set('view engine','ejs');

app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use('/uploads', express.static(__dirname + '/uploads'))

const fileFilter = function(req, file, callback){
    if(file.mimetype==='image/jpg' || file.mimetype==='image/png' || file.mimetype==='image/jpeg' || file.mimetype==='video/mp4'){
        callback(null, true)
    }
    else {
        callback(new Error('Only jpg, png, jpeg, mp4 files allowed'), false)
    }
}
const storage= multer.diskStorage({
    destination: function(req, file, callback){
        if (!fs.existsSync(__dirname + '/uploads'))
        fs.mkdirSync(__dirname + '/uploads')
        callback(null, 'uploads/');
    },
    filename:function(req, file, callback){
        callback(null, req.body.email + '-'+ req.body.name + '-' + Date.now() + path.extname(file.originalname));
    }
});

let recentUploads = []

const upload=multer({storage:storage, fileFilter: fileFilter}).array('files',20);

app.post('/upload', (req,res, next)=>{

    upload(req, res, function(err){

    if( err instanceof multer.MulterError){
        return res.json({
            result: 'Failure',
            message: err.message,
            recent: recentUploads 
        })
    }
    else if(err){
        return res.json({
            result: 'Failure',
            message: err.message,
            recent: recentUploads 
        })
    }

    recentUploads = req.files

    return res.json({
            result: 'Success',
            message: 'Files Uploaded Succesfully',
            recent: recentUploads 
    })
})
});

app.get('/', (req,res)=>{

    const allUploads = fs.existsSync(__dirname + '/uploads') ? fs.readdirSync(__dirname + '/uploads') : [] 

    res.render('index', {all: allUploads});
})

const port = process.env.PORT || 4000
app.listen(port,()=>{
    console.log(`server running on port ${port}...`);
})
