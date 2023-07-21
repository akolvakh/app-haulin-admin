import * as url from "url";

import 'dotenv/config'
import AdminJS, { ComponentLoader } from 'adminjs'
import express from 'express'
import Plugin from '@adminjs/express'
import Adapter, { Database, Resource } from '@adminjs/sql'

const componentLoader = new ComponentLoader()

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const Components = {
    Dashboard: componentLoader.add('Dashboard', './dashboard')
}

AdminJS.registerAdapter({
  Database,
  Resource,
});

const DEFAULT_ADMIN = {
  email: process.env.APP_USER,
  password: process.env.APP_PASSWORD,
}
  
const authenticate = async (email, password) => {
  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    return Promise.resolve(DEFAULT_ADMIN)
  }
  return null
}

const start = async () => {
  const app = express()

  app.use(express.static(__dirname + '/public'))

  const db = await new Adapter('postgresql', {
    connectionString: process.env.CONNECTION_STRING,
    database: process.env.LOGO_NAME,
  }).init();

  const locale = {
    translations: {
      en: {
        "components": {
          Login: {
            welcomeMessage: "",
            properties: {
              email: "Username",
            },
          }
        },
      }
    }
  }

  const admin = new AdminJS({
    branding: {
        logo: false,
        companyName: process.env.LOGO_NAME,
        withMadeWithLove: false
    },
    locale,
    databases: [db],
    componentLoader,
    dashboard: {
        component: Components.Dashboard
    },
    assets: {
      styles: ["/custom.css"]
    }
  });

  admin.watch()

  const router = Plugin.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: "AdminJS",
      cookiePassword: process.env.LOGO_NAME + '_secret',
    },
    null,
    {
      resave: true,
      saveUninitialized: true,
      secret: process.env.LOGO_NAME + '_secret',
      name: 'adminjs',
    }
);

  app.get('/', function(req, res) {
    res.redirect('/admin');
  });

  app.use(admin.options.rootPath, router)

  app.listen(3000, () => {
    console.log('app started')
  })
}

start()