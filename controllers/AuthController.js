const staff = require('../models/Staff');
const organization = require('../models/Organization')
const bcrypt = require('bcrypt'); // For password hashing
const jwt = require('jsonwebtoken'); // For generating JWT tokens