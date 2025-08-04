var express = require("express");
const bcrypt = require("bcrypt");
const validator = require("validator");

const Users = require("../models/User");
const Roles = require("../models/Roles");
const RolePrivileges = require("../models/RolePrivileges");
const UserRoles = require("../models/UserRoles");
const Response = require("../lib/Response");
const CustomError = require("../lib/Error");
const Enum = require("../config/Enum");
const AuditLogs = require("../lib/AuditLogs");
const logger = require("../lib/logger/LoggerClass");
const config = require("../config");
const jwt = require("jwt-simple");
const app = require("../app");
const { permission } = require("process");
const auth = require("../lib/auth")();
const i18n = new (require("../lib/i18n"))(config.DEFAULT_LANGUAGE);

var router = express.Router();

router.post("/auth", async (req, res) => {
  try {
    let { email, password } = req.body;

    Users.validateFieldsBeforeAuth(email, password);

    let user = await Users.findOne({ email });

    if (!user)
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        i18n.translate("COMMON.USER_NOT_FOUND_TITLE", req.user?.lang),
        i18n.translate("COMMON.USER_NOT_FOUND_DESCRIPTION", req.user?.lang)
      );

    if (!user.validPassword(password))
      throw new CustomError(
        Enum.HTTP_CODES.UNAUTHORIZED,
        i18n.translate(
          "COMMON.INVALID_EMAIL_OR_PASSWORD_TITLE",
          req.user?.lang
        ),
        i18n.translate(
          "COMMON.INVALID_EMAIL_OR_PASSWORD_DESCRIPTION",
          req.user?.lang
        )
      );

    let payload = {
      id: user.id,
      exp: parseInt(Date.now() / 1000) + config.JWT.EXPIRATION_TIME,
    };

    let token = jwt.encode(payload, config.JWT.SECRET);

    res.json(
      Response.success({
        success: true,
        token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      })
    );
  } catch (err) {
    let errorResponse = Response.error(err);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/register", async (req, res) => {
  let body = req.body;
  try {
    let user = await Users.findOne({ email: body.email });

    if (user) {
      return res.sendStatus(Enum.HTTP_CODES.NOT_FOUND);
    }

    if (!body.email)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.FIELD_REQUIRED_TITLE", req.user?.language, [
          "Email",
        ]),
        i18n.translate(
          "COMMON.FIELD_REQUIRED_DESCRIPTION",
          req.user?.language,
          ["Email"]
        )
      );

    if (!validator.isEmail(body.email))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.INVALID_FORMAT_TITLE", req.user?.language),
        i18n.translate(
          "COMMON.INVALID_EMAIL_FORMAT_DESCRIPTION",
          req.user?.language
        )
      );

    if (!body.password)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.FIELD_REQUIRED_TITLE", req.user?.language, [
          "Password",
        ]),
        i18n.translate(
          "COMMON.FIELD_REQUIRED_DESCRIPTION",
          req.user?.language,
          ["Password"]
        )
      );

    if (body.password.length < Enum.PASS_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.PASSWORD_MIN_LENGTH", req.user?.language, [
          Enum.PASS_LENGTH,
        ])
      );
    }

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    let createdUser = await Users.create({
      username: body.username,
      email: body.email,
      passwordHash: password,
      is_active: true,
      language: body.language || config.DEFAULT_LANGUAGE,
    });

    let role = await Roles.findOne({ name: Enum.ROLES.USER });

    await UserRoles.create({
      role_id: role.id,
      user_id: createdUser.id,
    });

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(Response.success({ success: true }, Enum.HTTP_CODES.CREATED));
  } catch (err) {
    let errorResponse = Response.error(err, req.user?.language);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.use(auth.authenticate());


router.get('/profile', async (req, res) => {
  try {
    const user = await Users.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});


router.get("/", auth.checkRoles("user_view"), async (req, res) => {
  try {
    let users = await Users.find();

    res.json(Response.success(users));
  } catch (err) {
    let errorResponse = Response.error(err);

    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/add", auth.checkRoles("user_add"), async (req, res) => {
  let body = req.body;

  try {
    if (!body.email)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.FIELD_REQUIRED_TITLE", req.user?.language, [
          "Email",
        ]),
        i18n.translate(
          "COMMON.FIELD_REQUIRED_DESCRIPTION",
          req.user?.language,
          ["Email"]
        )
      );
    if (!body.password)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.FIELD_REQUIRED_TITLE", req.user?.language, [
          "Password",
        ]),
        i18n.translate(
          "COMMON.FIELD_REQUIRED_DESCRIPTION",
          req.user?.language,
          ["Password"]
        )
      );

    if (!validator.isEmail(body.email))
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Invalid email format",
        "Please provide a valid email format"
      );

    if (body.password && body.password.length < Enum.PASSWORD_MIN_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Password is too short",
        "Please provide a password with at least {$Enum.PASSWORD_MIN_LENGTH} characters"
      );
    }

    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.FIELD_REQUIRED_TITLE", req.user?.lang, [
          "Roles",
        ]),
        i18n.translate("COMMON.FIELD_REQUIRED_DESCRIPTION", req.user?.lang, [
          "Roles",
        ])
      );
    }

    let roles = await Roles.find({ _id: { $in: body.roles } });

    if (roles.length == 0) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.FIELD_REQUIRED_TITLE", req.user?.lang, [
          "Roles",
        ]),
        i18n.translate("COMMON.FIELD_REQUIRED_DESCRIPTION", req.user?.lang, [
          "Roles",
        ])
      );
    }

    let password = bcrypt.hashSync(body.password, bcrypt.genSaltSync(8), null);

    let createdUser = await Users.create({
      email: body.email,
      passwordHash: password,
      username: body.username,
      isActive: true,
    });

    for (let role of roles) {
      await UserRoles.create({ user_id: createdUser._id, role_id: role._id });
    }

    AuditLogs.info(req.user?.email, "User", "Add", createdUser);

    logger.info(req.user?.email, "User", "Add", createdUser);

    res
      .status(Enum.HTTP_CODES.CREATED)
      .json(Response.success("User created successfully"));
  } catch (err) {
    logger.error(req.user?.email, "User", "Add", err);
    let errorResponse = Response.error(err, req.user?.language);

    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/update", auth.checkRoles("user_update"), async (req, res) => {
  try {
    let body = req.body;

    let updates = {};

    if (!body.id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.FIELD_REQUIRED_TITLE", req.user?.lang, ["ID"]),
        i18n.translate("COMMON.FIELD_REQUIRED_DESCRIPTION", req.user?.lang, [
          "ID",
        ])
      );

    if (body.password && body.password.length < Enum.PASSWORD_MIN_LENGTH) {
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        "Password is too short",
        "Please provide a password with at least {$Enum.PASSWORD_MIN_LENGTH} characters"
      );
    }

    if (body.password)
      updates.password = bcrypt.hashSync(
        body.password,
        bcrypt.genSaltSync(8),
        null
      );

    if (body.email && validator.isEmail(body.email)) updates.email = body.email;

    if (body.username) updates.username = body.username;

    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

    if (Array.isArray(body.roles) && body.roles.length > 0) {
      let userRoles = await UserRoles.find({ user_id: body.id });

      let removedRoles = userRoles.filter(
        (x) => !body.roles.includes(x.role_id)
      );

      let newRoles = body.roles.filter(
        (x) => !userRoles.map((r) => r.role_id).includes(x)
      );

      if (removedRoles.length > 0) {
        await UserRoles.deleteMany({
          user_id: body.id,
          role_id: { $in: removedRoles.map((r) => r.role_id) },
        });
      }

      if (newRoles.length > 0) {
        for (let newRole of newRoles) {
          let userRole = new UserRoles({
            user_id: body.id,
            role_id: newRole,
          });

          await userRole.save();
        }
      }
    }

    await Users.updateOne({ _id: body.id }, { $set: updates });

    res.json(Response.success({ success: true }));
  } catch (err) {
    let errorResponse = Response.error(err);

    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post("/delete", auth.checkRoles("user_delete"), async (req, res) => {
  try {
    let body = req.body;

    if (!body.id)
      throw new CustomError(
        Enum.HTTP_CODES.BAD_REQUEST,
        i18n.translate("COMMON.FIELD_REQUIRED_TITLE", req.user?.lang, ["ID"]),
        i18n.translate("COMMON.FIELD_REQUIRED_DESCRIPTION", req.user?.lang, [
          "ID",
        ])
      );

    await Users.deleteOne({ _id: body.id });

    await UserRoles.deleteMany({ user_id: body.id });

    res.json(Response.success({ success: true }));
  } catch (err) {
    let errorResponse = Response.error(err);

    res.status(errorResponse.code).json(errorResponse);
  }
});

module.exports = router;
