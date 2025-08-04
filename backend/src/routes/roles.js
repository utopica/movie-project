const express = require('express');

const Roles = require('../models/Roles');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const rolePrivileges = require('../config/role_privileges');
const RolePrivileges = require('../models/RolePrivileges');
const AuditLogs = require('../lib/AuditLogs');
const router = express.Router();

const auth = require("../lib/auth")();

router.use(auth.authenticate());

router.get('/', auth.checkRoles("role_view"), async (req, res) => {
    try{
        let roles = await Roles.find();

        res.json(Response.success(roles));
    }catch(err) {
        let errorResponse = Response.error(err);

        res.status(errorResponse.code).json(errorResponse);
    }
})

router.post('/add', auth.checkRoles("role_add"), async (req, res) => {
    let body = req.body;

    try{

        if(!body.name) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "Name is required");

        if(!body.permissions || !Array.isArray(body.permissions) || body.permissions.length === 0) {
            throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "Permissions must be an array");
        }

        let role = new Roles({
            name : body.name,
            is_active: body.is_active || true,
            created_by: req.user?.id
        })

        await role.save();

        AuditLogs.info(req.user?.email, req.originalUrl, Enum.LOG_LEVELS.INFO, {role: role});

        for (let i = 0 ; i < body.permissions.length ; i++){
            
            let priv = new RolePrivileges({
                role_id: role._id,
                permission: body.permissions[i],
                created_by: req.user?.id
            });

            await priv.save();

        }

        res.json(Response.success({success: true}));

    }catch(err){
        let errorResponse = Response.error(err);

        res.status(errorResponse.code).json(errorResponse);

    }
})

router.post('/update', auth.checkRoles("role_update"), async (req, res) => {
    let body = req.body;

    try{
        if(!body.id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "ID is required");

        let updates = {};

        if(body.name) updates.name = body.name;
        if(typeof body.is_active === "boolean") updates.is_active = body.is_active;
        if(body.permissions && Array.isArray(body.permissions) && body.permissions.length > 0) {
            
            let permissions = await RolePrivileges.find({role_id : body.id});

            let removedPermissions = permissions.filter( x => !body.permissions.includes( x.permission))

            //let newPermissions = body.permissions.filter( x => !permissions.some( p => p.permission === x));
            let newPermissions = body.permissions.filter( x => !permissions.map(p=> p.permission).includes(x));

            if(removedPermissions.length > 0) {
                await RolePrivileges.deleteMany({role_id: body.id, permission: {$in: removedPermissions.map(p => p.permission)}});
            }

            if(newPermissions.length > 0) {
                for (let i = 0 ; i < newPermissions.length ; i++){

                    let priv = new RolePrivileges({
                        role_id: body.id,
                        permission: newPermissions[i],
                        created_by: req.user?.id
                    });
                    await priv.save();
                }   

            }

    
        }

        await Roles.updateOne({_id: body.id}, updates);

        return res.json(Response.success({success: true}));

    }catch(err) {
        let errorResponse = Response.error(err);

        res.status(errorResponse.code).json(errorResponse);
    }
})

router.post('/delete', auth.checkRoles("role_delete"), async (req, res) => {
    let body = req.body;

    try{
        if(!body.id) throw new CustomError(Enum.HTTP_CODES.BAD_REQUEST, "Validation Error", "ID is required");

        await RolePrivileges.deleteMany({ role_id: body.id });

        await Roles.deleteOne({_id: body.id});

        return res.json(Response.success({success: true}));

    }catch(err) {
        let errorResponse = Response.error(err);

        res.status(errorResponse.code).json(errorResponse);
    }
})

router.get('/role_privileges', (req, res) => {
    try {
        res.json(rolePrivileges);
    } catch (err) {
        let errorResponse = Response.error(err);
        res.status(errorResponse.code).json(errorResponse);
    }
});



module.exports = router;
