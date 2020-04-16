using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace crystal_po_api.util
{
    public class UserDestinationConfiguration : IDestinationConfiguration
    {
        private String sapName;
        private String sapPassword;
        private String ldapName;

        public UserDestinationConfiguration(String ldapName, String sapName, String sapPassword)
        {
            this.ldapName = ldapName;
            this.sapName = sapName;
            this.sapPassword = sapPassword;
        }

        public bool ChangeEventsSupported()
        {
            return false;
        }

        public event RfcDestinationManager.ConfigurationChangeHandler ConfigurationChanged;

        public RfcConfigParameters GetParameters(string destinationName)
        {
            RfcConfigParameters parameters = new RfcConfigParameters();
            parameters[RfcConfigParameters.Name] = ldapName;
            parameters[RfcConfigParameters.PeakConnectionsLimit] = "10";
            parameters[RfcConfigParameters.IdleTimeout] = "10"; // we keep connections for 10 minutes
            parameters[RfcConfigParameters.User] = sapName;
            parameters[RfcConfigParameters.Password] = sapPassword;
            RfcConfigParameters p = ConfigUtil.getConfigParameter();
            parameters[RfcConfigParameters.Client] = p[RfcConfigParameters.Client];
            parameters[RfcConfigParameters.Language] = p[RfcConfigParameters.Language];
            parameters[RfcConfigParameters.AppServerHost] = p[RfcConfigParameters.AppServerHost];
            parameters[RfcConfigParameters.SystemNumber] = p[RfcConfigParameters.SystemNumber];
            return parameters;
        }
    }
}