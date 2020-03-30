using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SAP.Middleware.Connector;

namespace SOH_LaunchPad_CENReport
{
    public class SAPProc
    {
        private string sap_name = System.Configuration.ConfigurationManager.AppSettings["SAP_Name"].ToString();
        private string user_id = System.Configuration.ConfigurationManager.AppSettings["SAP_User"].ToString();
        private string password = System.Configuration.ConfigurationManager.AppSettings["SAP_Password"].ToString();
        private string client = System.Configuration.ConfigurationManager.AppSettings["SAP_Client"].ToString();
        private string host = System.Configuration.ConfigurationManager.AppSettings["SAP_Host"].ToString();
        private string sysNum = System.Configuration.ConfigurationManager.AppSettings["SAP_SysNum"].ToString();

        public SAPProc()
        {
        }

        public string Run(string guid)
        {
            RfcDestination destination = RfcDestinationManager.GetDestination(getParameters());
            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_LAUNCHPAD");
                rfcFunction.SetValue("I_GUID", guid);

                rfcFunction.Invoke(destination);
                return "OK";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        protected RfcConfigParameters getParameters()
        {
            RfcConfigParameters parameters = new RfcConfigParameters();
            parameters.Add(RfcConfigParameters.Name, sap_name);
            parameters.Add(RfcConfigParameters.User, user_id);
            parameters.Add(RfcConfigParameters.Password, password);
            parameters.Add(RfcConfigParameters.Client, client);
            parameters.Add(RfcConfigParameters.Language, "EN");
            parameters.Add(RfcConfigParameters.AppServerHost, host);
            parameters.Add(RfcConfigParameters.SystemNumber, sysNum);
            parameters.Add(RfcConfigParameters.IdleTimeout, "3600");
            parameters.Add(RfcConfigParameters.PoolSize, "5");
            return parameters;
        }
    }
}