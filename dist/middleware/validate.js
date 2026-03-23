"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        res.status(422).json({
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
        return;
    }
    req[source] = result.data;
    next();
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map