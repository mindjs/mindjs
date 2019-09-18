/*
 * Framework100500
 * Copyright (c) 2019 Oleksandr Bondarenko
 * MIT Licensed
 */

const HttpStatus = require('http-status-codes');

const {
  HTTP_METHODS,
  HTTP_PROTOCOLS,

  Module,
  Inject,
  Injectable,

  CommonModule,
} = require('./src');

module.exports = {
  // re-export http status codes for common usages
  HttpStatus,

  HTTP_METHODS,
  HTTP_PROTOCOLS,

  Module,
  Inject,
  Injectable,

  CommonModule,
};
