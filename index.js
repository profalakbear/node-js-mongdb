const conf = require('./conf');
const fs = require('fs');
const mongoose = require('mongoose');

const countsModel = require('./countsModel');
const masterModel = require('./masterModel');

const count_json = require('./json_inputs/counts.json');
const master_json = require('./json_inputs/master.json');

mongoose.connect(conf.MONGO, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Yeaah! Connected!')
});

countsModel.insertMany(count_json, (err, docs) => {
     if (err){ 
         return console.error(err);
    } else {
      console.log("Multiple documents (COUNTS) inserted to Collection");
    }
});

masterModel.insertMany(master_json, (err, docs) => {
    if (err){ 
        return console.error(err);
    } else {
      console.log("Multiple documents (MASTERS) inserted to Collection");
    }
});

async function getDataFromMongoose() {
    return countsModel.find().then(result=>{
        return result
    }).catch(err=>{
        console.log(err)
    })
}

async function Report1() {
  const x = await getDataFromMongoose()
  x.forEach((y)=> {
      y.completedCounts.forEach((z)=>{
          z.contents.forEach((o)=>{
              fs.appendFile("REPORT_1_Location_Barcode_Amount.txt", `${y.locationCode}, ${o.barcode}, ${o.amount} \n `, (err) => {
                  if (err) {
                    console.log(err);
                  }
                })
          })
      })
  })
}

async function Report2(){
  return await countsModel.aggregate(
    [
      {
        "$unwind": "$completedCounts"
      },
      {
        "$unwind": "$completedCounts.contents"
      },
      {
        $group: {
          "_id": "$completedCounts.contents.barcode",
          "total": {
            $sum: "$completedCounts.contents.amount"
          }
        }
      }
    ]).exec(function (err, res) {
    if (err) {
      throw err;
    }

    res.forEach((x)=>{
      fs.appendFile("REPORT_2_Barcode-Amount.txt", `${x._id}, ${x.total} \n `, (err) => {
        if (err) {
          console.log(err);
        }
      })
    })

    return res;
  });
};

async function Report3(){
return await countsModel.aggregate(
  [
    {
      "$unwind": "$completedCounts"
    },
    {
      "$unwind": "$completedCounts.contents"
    },
    {
      $lookup: {
        "from": "masters",
        "localField": "completeCounts.contents.barcode",
        "foreignField": "masters.barcode",
        "as": "masters"
      }
    },
    {
      $group: {
        "_id": "$completedCounts.contents.barcode",
        "branch":{
          $first: "$locationCode"
        },
        "no":{
          $first: "$masters.sku"
        },
        "total": {
          $sum: "$completedCounts.contents.amount"
        },
        "product": {
          $first: "$masters.urun adi"
        }
      }
    },
  ], {
    allowDiskUse:true,
    cursor:{}
   }).exec(function (err, res) {
  if (err) {
    throw err;
  }

  res.forEach((x)=>{
    fs.appendFile("REPORT_3_Aggregated .txt", `${x.branch}, ${x._id}, ${x.total}, ${x.no}, ${x.product} \n `, (err) => {
      if (err) {
        console.log(err);
      }
    })
  })

  return res;
});
};

Report1()
Report2()
Report3()