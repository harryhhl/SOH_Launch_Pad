using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using SAP.Middleware.Connector;
using crystal_sap_cryto;

namespace SOH_LaunchPad_CENReport
{
    public class SAPProc
    {
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
            var settings = Common.GetSysSettings();
            RfcConfigParameters parameters = new RfcConfigParameters();
            parameters.Add(RfcConfigParameters.Name, settings["SAP_Name"]);
            parameters.Add(RfcConfigParameters.User, Cryto.decrypt(settings["SAP_User"]));
            parameters.Add(RfcConfigParameters.Password, Cryto.decrypt(settings["SAP_Password"]));
            parameters.Add(RfcConfigParameters.Client, settings["SAP_Client"]);
            parameters.Add(RfcConfigParameters.Language, "EN");
            parameters.Add(RfcConfigParameters.AppServerHost, settings["SAP_Host"]);
            parameters.Add(RfcConfigParameters.SystemNumber, settings["SAP_SysNum"]);
            parameters.Add(RfcConfigParameters.IdleTimeout, "3600");
            parameters.Add(RfcConfigParameters.PoolSize, "5");
            return parameters;
        }
    }
}