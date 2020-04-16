using crystal_po_api.util;
using crystal_sap_cryto;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Web;
using System.Web.Security;
using System.Web.SessionState;

namespace SOH_LaunchPad_Approval
{
    public class Global : System.Web.HttpApplication
    {
        private InMemoryDestinationConfiguration sapConfig = new InMemoryDestinationConfiguration();

        protected void Application_Start(object sender, EventArgs e)
        {
            if (ConfigurationManager.AppSettings["IGNORE_SSL"].Equals("true"))
            {
                System.Net.ServicePointManager.ServerCertificateValidationCallback = 
                    delegate(object s, X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors) { 
                        return true; 
                    };
            }
            addOrEditParameter(); 
            RfcDestinationManager.RegisterDestinationConfiguration(sapConfig);
        }

        private void addOrEditParameter()
        {
            RfcConfigParameters p = ConfigUtil.getConfigParameter();
            
            sapConfig.AddOrEditDestination(p[RfcConfigParameters.Name], int.Parse(p[RfcConfigParameters.PoolSize]),
                                p[RfcConfigParameters.User], p[RfcConfigParameters.Password], p[RfcConfigParameters.Language], p[RfcConfigParameters.Client],
                                p[RfcConfigParameters.AppServerHost], p[RfcConfigParameters.SystemNumber]);
        }

        protected void Session_Start(object sender, EventArgs e)
        {
        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {
            /*RfcConfigParameters p = ConfigUtil.getConfigParameter();
            sapConfig.changeLoginInfo(p);
            */
        }

        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {

        }

        protected void Application_Error(object sender, EventArgs e)
        {

        }

        protected void Session_End(object sender, EventArgs e)
        {

        }

        protected void Application_End(object sender, EventArgs e)
        {
            RfcDestinationManager.UnregisterDestinationConfiguration(sapConfig);
        }
    }
}