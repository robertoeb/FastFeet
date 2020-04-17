import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import DeliverymanController from './app/controllers/DeliverymanController';
import FileController from './app/controllers/FileController';
import DeliveryController from './app/controllers/DeliveryController';
import JobController from './app/controllers/JobController';
import PasswordController from './app/controllers/PasswordController';
import DeliveryProblemController from './app/controllers/DeliveryProblemController';

import adminAuthMiddleware from './app/middlewares/authAdmin';
import deliverymanAuthMiddleware from './app/middlewares/authDeliveryman';
import passwordAuthMiddleware from './app/middlewares/authPassword';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);
routes.post('/forgotpassword', PasswordController.store);

routes.put('/newpassword', passwordAuthMiddleware, PasswordController.update);

routes.use(deliverymanAuthMiddleware);

routes.get('/deliveryman/jobs', JobController.index);
routes.put('/deliveryman/jobs/:deliveryId', JobController.update);

routes.get('/deliveries/problems', DeliveryProblemController.index);
routes.get('/deliveries/:deliveryId/problems', DeliveryProblemController.show);
routes.post(
  '/deliveries/:deliveryId/problems',
  DeliveryProblemController.store
);

routes.use(adminAuthMiddleware);

routes.put('/users', UserController.update);

routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);

routes.get('/deliverymen', DeliverymanController.index);
routes.post('/deliverymen', DeliverymanController.store);
routes.put('/deliverymen/:deliverymanId', DeliverymanController.update);
routes.delete('/deliverymen/:deliverymanId', DeliverymanController.delete);

routes.get('/deliveries', DeliveryController.index);
routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries/:deliveryId', DeliveryController.update);
routes.delete('/deliveries/:deliveryId', DeliveryController.delete);

routes.delete(
  '/deliveries/:deliveryId/problems',
  DeliveryProblemController.delete
);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;
