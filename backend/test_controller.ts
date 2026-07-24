import { rbacController } from './src/controllers/rbac.controller';
import { Request, Response } from 'express';

const req = {} as Request;
const res = {
  statusCode: 200,
  status: function(s: number) {
    this.statusCode = s;
    return this;
  },
  json: function(data: any) {
    console.log('STATUS:', this.statusCode);
    if (this.statusCode !== 200) {
      console.log('ERROR RESPONSE:', data);
    } else {
      console.log('SUCCESS, count:', data.length);
    }
  }
} as unknown as Response;

async function run() {
  await rbacController.getPerfisAcesso(req, res);
}

run();
