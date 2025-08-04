const passport = require("passport");
const { ExtractJwt, Strategy } = require("passport-jwt");
const Users = require("../models/User");
const UserRoles = require("../models/UserRoles");
const RolePrivileges = require("../models/RolePrivileges");
const CustomError = require("./Error");
const Response = require("./Response");
const {HTTP_CODES} = require("../config/Enum")

const config = require("../config");
const privs = require("../config/role_privileges");
const { lang } = require("./i18n");

module.exports = function () {
  let strategy = new Strategy(
    {
      secretOrKey: config.JWT.SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async (payload, done) => {
      try {
        let user = await Users.findOne({
          _id: payload.id,
        });

        if (user) {
          let userRoles = await UserRoles.find({ user_id: payload.id });

          let rolePrivileges = await RolePrivileges.find({
            role_id: { $in: userRoles.map((role) => role.role_id) },
          });

          let privileges = rolePrivileges.map((rp) =>
            privs.privileges.find((x) => x.key == rp.permission)
          );

          done(null, {
            id: user._id,
            roles: privileges,
            email: user.email,
            language: user.language,
            exp: parseInt(Date.now() / 1000) * config.JWT.EXPIRATION_TIME,
          });
        } else {
          done(new Error("User not found"), null);
        }
      } catch (err) {
        done(err, null);
      }
    }
  );

  passport.use(strategy);

  return {
    initialize: function () {
      return passport.initialize();
    },

    authenticate: function () {
      return passport.authenticate("jwt", { session: false });
    },

    checkRoles: (...expectedRoles) => {
      return (req, res, next) => {
        let i = 0;
        let privileges = req.user.roles.map((p) => p.key);

        while (
          i < expectedRoles.length &&
          !privileges.includes(expectedRoles[i])
        )
          i++;

        if (i >= expectedRoles.length) {

          let response = Response.error(new CustomError(HTTP_CODES.UNAUTHORIZED, "Need Permission"));

          return res.status(response.code).json(response);
        } 

        return next(); // user authorized
      };
    },
  };
};
