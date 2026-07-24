const { rbacController } = require('./src/controllers/rbac.controller');

// Mock request and response
const req = {};
const res = {
  status: function(s) {
    this.statusCode = s;
    return this;
  },
  json: function(data) {
    console.log('STATUS:', this.statusCode);
    if (this.statusCode !== 200) {
      console.log('ERROR RESPONSE:', data);
    } else {
      console.log('SUCCESS, count:', data.length);
    }
  }
};

async function run() {
  await rbacController.getPerfisAcesso(req, res);
}

run();
