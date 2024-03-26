# AWS API Gateway ---> Lambda ---> DynamoDB 

Se detalla la instrumentación de una funcion AWS Lambda con Instana.

1. Crear la tabla "product-inventory" en DynamoDB con el partition key "productId"

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/122b4d73-b45a-4edb-bece-f02e9dc9af7c)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/4ea63c6d-2879-41cf-904c-a5b5fa1343c8)

2. Crear una funcion Lambda con el runtime Node.js 16.x y crear el rol de ejecucion "serverless-api-role"

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/85ca2e20-ded3-4850-8441-0929bdbfcb74)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/2650bc6d-9d2c-423d-977b-48c6614f4fba)


3. Editar el rol creado para la funcion Lambda y agregar permisos para acceder a la tabla de DynamoDB (AmazonDynamoDBFullAccess y CloudWatchLogsFullAccess)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/0d3f4829-e6fd-466f-9896-1ee14e41318f)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/9e8c5058-19a9-4731-905b-3073501b3ead)

4. Crear el servicio API Gateway REST API "serverless-api"

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/9422e612-9674-4c29-ad98-6014797a9561)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/a210cb33-dbfc-4533-9897-ed96b63d7813)

5. Crear los siguientes recursos y metodos:

  - health (GET)
  - product (DELETE, GET, PATCH, POST)
  - products (GET)
 
  ![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/14108357-c98d-49c3-a1b6-c29157117969)
  
  Agregar el metodo indicado en el punto anterior para cada recurso.
  
  ![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/178f7e86-06be-4eea-ba7b-6d4f77da8d61)
  
  Configuracion por metodo dependiendo el tipo y seleccionando la función lambda creado en el punto 2.

  ![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/ad2c2441-b7a6-460d-8fdf-592e0e06957a)

6. La configuracion del API gateway debe quedar de la siguiente manera.

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/8676387c-ec72-482b-a7de-443169e4ede7)

7. Desplegar los cambios de API Gateway.

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/8d41cbee-9bca-4709-b4ed-5300d7325b38)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/c8a7a12d-1841-466e-8afd-1a1f8b04b5b4)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/dee91f3b-3eb5-4181-928f-47133720e836)

8. Editar la funcion Lambda y agregar el codigo del archivo "index.js" del repositorio, colocar la misma region donde se encuentran desplegados los servicios y desplegar los cambios.

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/a0d7cd5f-60d5-4e33-9c7d-5201413eeeb4)

9. Agregar un nuevo Layer en el servicio Lambda, se utilizara para la instrumentacion con instana.

  ![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/603e3121-a1c4-4141-aafa-5c9f4eb38324)
  
  El formato del ARN (arn:aws:lambda:us-east-1:410797082306:layer:instana-nodejs:174) para el Layer debe referenciar a la region donde se desplegaron los servicios, luego verificar la validez del layer.
  
  ![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/3644ff62-61ed-4a5e-9665-9662f08f0991)
  
 10. Editar el handler (instana-aws-lambda-auto-wrap.handler) de la funcion Lambda referenciando al agente instana.

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/fe852db4-6011-40a3-88ba-626ba5896a5f)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/162076bb-2d9e-42f7-ac55-37853ee88651)

11. Agregar las siguientes variables de entorno en la funcion Lambda.

  - INSTANA_AGENT_KEY : key del tenant Instana SaaS para la comunicacion con el tenant.
  - INSTANA_ENDPOINT_URL : Backend Instana SaaS.
  - INSTANA_ENDPOINT_URL : Handler actual de la funcion.

  ![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/eadf30df-76d7-4f2b-9b50-dd01c8bf3642)

12. Realizar las pruebas para cada endpoint via postman.

  Registro de Productos
  
  ![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/48235037-2124-4ddd-9d03-d386abaa740a)

  Listar Productos

  ![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/0b7173a1-87c2-468f-8ef8-5b7e57e6ebcb)


13. Validar en la consola de Instana.

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/b4d1ca07-874b-450d-994d-13d3bde3927e)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/5df8d108-3e19-425b-832d-fd6e34344fe9)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/89eb41a0-2d09-4e27-9404-e4fef62d7280)

![image](https://github.com/juan-conde-21/aws_lambda/assets/13276404/89d8df37-f48b-4de0-88d1-9bd7789f44dd)


