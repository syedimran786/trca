const regex = {
  nameRegex: /^[A-Za-z\s\.]+$/,
  mobileRegex: /^(\+|\d)[0-9]{7,16}$/,
  emailRegex: /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+(\.\w{2,3})$/,
  notAllowSpecialChar: /[^a-zA-Z0-9]/,
  nameWithSpaces: /^[a-zA-Z ]*$/,
  nameWithSpacesAndNumbers: /^[a-zA-Z0-9 ]*$/,
  pancardNumberRegex: /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/,
  indianMobileNumberRegex: /^[6-9]\d{9}$/,
  adhaarNumberRegex: new RegExp(/^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/),
};

export { regex };
