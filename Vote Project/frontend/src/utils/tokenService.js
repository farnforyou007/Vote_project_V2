// src/utils/tokenService.js
// export const tokenService = {
//     get: () => sessionStorage.getItem("token"),
//     set: (token) => sessionStorage.setItem("token", token),
//     remove: () => sessionStorage.removeItem("token"),
// };

export const tokenService = {
    get: () => localStorage.getItem("token"),
    set: (token) => localStorage.setItem("token", token),
    remove: () => localStorage.removeItem("token"),
};

