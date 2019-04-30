const functions = require('../functions');
const KNXConfigModel = require('../models/knxConfig')

exports.addConfig = (req, res) => {
    const config = {
        ipAddr: req.body.ipAddr,
        port: req.body.port,
        lights : req.body.lights,
        name : req.body.name
    }
    KNXConfigModel.findOne({
            $and: [
                {
                    ipAddr: req.body.ipAddr
                },
                {
                    port: req.body.port
                }
            ]
        },
        (err, result) => {
            if (err) return res.send({
                success: false,
                errorMessage: "Erreur lors de l'ajout d'une nouvelle configuration KNX: " + err
            })
            if (result) return res.send({
                success: false,
                errorMessage: "Une configuration de machine KNX éxiste déjà avec ces options"
            })
            else {
                KNXConfigModel.create(config, (err, result) => {
                    if (err) return res.send({
                        success: false,
                        errorMessage: "Erreur lors de l'ajout d'une nouvelle configuration KNX: " + err
                    })
                    functions.addConnection(result)
                    return res.send({
                        success: true
                    });
                })
            }
        })
}

exports.updateConfig = (req, res) => {
    console.log(JSON.stringify(req.body))
    KNXConfigModel.findOne({name: req.body.name}, 
        (err, result) => {
            if(err) return res.status(409);
            if(result) return res.send({success : false, errorMessage : "Une machine porte déja ce nom"});
            else {
                const id = req.body._id;
                const data = req.body;
                KNXConfigModel.update({"_id":id}, data, (err, result) => {
                    if(err){
                        return res.status(409).send({success : false, errorMessage : ""})
                    }else{
                        
                        return res.status(202).send({success : true});
                    }
                });
            }
        });
};

exports.deleteConfig = (req, res) => {
    KNXConfigModel.findOne({_id : req.params.idKnx},
        (err, result) => {
            if (err) return res.send({
                success: false,
                errorMessage: "Erreur lors de la suppression de la configuration KNX: " + err
            })
            if (!result) return res.send({
                success: false,
                errorMessage: "Aucune machine KNX n'éxiste avec ces options"
            })
            else {
                KNXConfigModel.deleteOne({_id: result._id}, (err, result) => {
                    if (err) return res.send({
                        success: false,
                        errorMessage: "Erreur lors de la suppression de la configuration KNX: " + err
                    })

                    const indexConnection = functions.connectionsList.findIndex(i => i._id === req.params.idKnx);
                    if(indexConnection > -1) functions.connectionsList.splice(indexConnection,1)

                    return res.send({
                        success: true
                    });
                })
            }
        })
}

exports.findConfigs = (req,res) => {
    KNXConfigModel.find({}, (err, results) => {
        if (err) return res.send({
            success: false,
            errorMessage: "Erreur lors de la récupération des configurations KNX: " + err
        })
       return res.send(results)
    })
}

exports.connect = (req, res) => {
    var state = functions.connectionKnx(req.params.idKnx);
    if (state) {
        res.send({
            success: true
        })
        // ajouter dans la socket que le mec c'est co à la machine KNX
    } else res.send(state);
}

exports.disconnect = (req, res) => {
    var state = functions.deconnectionKnx(req.params.idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
}

exports.startAllLights = (req, res) => {
    var state = functions.startAllLights(req.params.idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
};

exports.stopAllLights = (req, res) => {
    var state = functions.stopAllLights(req.params.idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
};

exports.startLight = (req, res) => {
    const id = req.body.id;
    const idKnx = req.body.idKnx
    var state = functions.startLight(id,idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
}

exports.stopLight = (req, res) => {
    const id = req.body.id;
    const idKnx = req.body.idKnx
    var state = functions.stopLight(id,idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
}

exports.startChase = (req, res) => {
    const idKnx = req.params.idKnx
    var state = functions.startChase(idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
};

exports.stopChase = (req, res) => {
    const idKnx = req.params.idKnx
    var state = functions.stopChase(idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
};

exports.setInterval = (req, res) => {
    const interval = req.body.interval;
    const idKnx = req.body.idKnx
    var state = functions.setInterval(interval,idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
};

exports.reverse = (req, res) => {
    var state = functions.reverse(req.params.idKnx);
    (state) ? res.send({
        success: true
    }): res.send(state);
};

exports.getAllLight = (req, res) => {
    var state = functions.getAllLight(req.params.idKnx);
    (state.success) ? res.send(state.data): res.send(state);
};

exports.addLight = (req, res) => {
    const light = req.body.light;
    const idKnx = req.body.idKnx
    var state = functions.addLight(light,idKnx);
    addLightFunction(light,idKnx,res);
};

exports.removeLight = (req, res) => {
    const light = req.body.light;
    const idKnx = req.body.idKnx
    functions.removeLight(light,idKnx);
    removeLightFunction(light,idKnx,res);
};

addLightFunction = (light,idKnx,res)=>{
    KNXConfigModel.findOneAndUpdate(
        { _id: idKnx }, 
        { $push: { lights: light } },
        (error, resultat) => {
            if(error) res.send({success:false, errorMessage:"Erreur lors de l'ajout de la lumière dans la base de données: "+error})
            else res.send({success:true})
        });
}

removeLightFunction = (light,idKnx,res)=>{
    KNXConfigModel.findOneAndUpdate(
        { _id: idKnx }, 
        { $set: { lights: light  } },
        (error, resultat) => {
             if(error) res.send({success:false, errorMessage:"Erreur lors de la suppression de la lumière dans la base de données: "+error})
             else res.send({success:true})
         });
}

