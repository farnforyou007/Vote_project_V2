// src/utils/tokenService.js
export const tokenService = {
    get: () => sessionStorage.getItem("token"),
    set: (token) => sessionStorage.setItem("token", token),
    remove: () => sessionStorage.removeItem("token"),
};
