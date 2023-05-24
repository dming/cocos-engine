(function () {
    /*
     * SystemJS named register extension
     * Supports System.register('name', [..deps..], function (_export, _context) { ... })
     *
     * Names are written to the registry as-is
     * System.register('x', ...) can be imported as System.import('x')
     */
    (function (global) {
        const System = global.System;
        setRegisterRegistry(System);
        const systemJSPrototype = System.constructor.prototype;
        const constructor = System.constructor;
        const SystemJS = function () {
            constructor.call(this);
            setRegisterRegistry(this);
        };
        SystemJS.prototype = systemJSPrototype;
        System.constructor = SystemJS;

        let firstNamedDefine;
        let firstName;

        function setRegisterRegistry(systemInstance) {
            systemInstance.registerRegistry = Object.create(null);
            systemInstance.namedRegisterAliases = Object.create(null);
        }

        const register = systemJSPrototype.register;
        systemJSPrototype.register = function (name, deps, declare, metas) {
            if (typeof name !== 'string') {
                return register.apply(this, arguments);
            }
            const define = [deps, declare, metas];
            this.registerRegistry[name] = define;
            // console.log("[dming] systemJSPrototype.register name=%s, deps=%j", name, deps);
            if (!firstNamedDefine) {
                firstNamedDefine = define;
                firstName = name;
            }
            Promise.resolve().then(() => {
                firstNamedDefine = null;
                firstName = null;
            });
            return register.apply(this, [deps, declare, metas]);
        };

        const resolve = systemJSPrototype.resolve;
        systemJSPrototype.resolve = function (id, parentURL) {
            let finalUrl;
            try {
                // Prefer import map (or other existing) resolution over the registerRegistry
                finalUrl = resolve.call(this, id, parentURL);
                // console.log("[dming] systemJSPrototype.resolve [origin]: id=%s, parentURL=%s, final=%s", id, parentURL, finalUrl);
                return finalUrl;
            } catch (err) {
                if (id in this.registerRegistry) {
                    finalUrl = this.namedRegisterAliases[id] || id;
                    // console.log("[dming] systemJSPrototype.resolve [namedRegisterAliases]: id=%s, parentURL=%s, final=%s", id, parentURL, finalUrl);
                    return finalUrl;
                }
                throw err;
            }
        };

        const instantiate = systemJSPrototype.instantiate;
        systemJSPrototype.instantiate = function (url, firstParentUrl, meta) {
            const result = this.registerRegistry[url];
            if (result) {
                this.registerRegistry[url] = null;
                return result;
            } else {
                return instantiate.call(this, url, firstParentUrl, meta);
            }
        };

        const getRegister = systemJSPrototype.getRegister;
        systemJSPrototype.getRegister = function (url) {
            // Calling getRegister() because other extras need to know it was called so they can perform side effects
            const register = getRegister.call(this, url);

            if (firstName && url) {
                this.namedRegisterAliases[firstName] = url;
            }
            // console.log("[dming] systemJSPrototype.getRegister url=%s, firstname=%s, !!firstNamedDefine=%s, !!register=%s", url, firstName, !!firstNamedDefine, !!register);
            const result = firstNamedDefine || register;
            firstNamedDefine = null;
            firstName = null;
            return result;
        };
    }(typeof self !== 'undefined' ? self : global));
}());

console.log('load ', __filename);
