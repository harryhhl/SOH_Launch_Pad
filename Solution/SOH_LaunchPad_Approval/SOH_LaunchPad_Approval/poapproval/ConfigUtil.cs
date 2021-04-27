using crystal.model;
using crystal.util;
using crystal_sap_cryto;
using SAP.Middleware.Connector;
using SOH_LaunchPad_Approval.common;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
/*
 * -------------------------------------------------
 *  07/09/2015      Arvin        Add servicePO_DOCTYPE/rawPO_DOCTYPE/subPO_DOCTYPE
 *      the last update: 2015-09-07 12:00
 */
namespace crystal_po_api.util
{
    public class ConfigUtil
    {
        public static String SAP_DEST_NAME = "SOH_LaunchPad";

        //07/09/2015      Arvin   Add
        public static String[] servicePO_DOCTYPE = ConfigurationManager.AppSettings["SERVICE_PO_DOC_TYPE"].ToString().Split(',');
        public static String[] rawPO_DOCTYPE = ConfigurationManager.AppSettings["RAW_MATERIAL_PO_DOC_TYPE"].ToString().Split(',');
        public static String[] subPO_DOCTYPE = ConfigurationManager.AppSettings["SUB_MATERIAL_PO_DOC_TYPE"].ToString().Split(',');

        //07/09/2015      Arvin   Add
        public static Dictionary<String, String> getPO_DocType(String poType)
        {
            String[] PO_DOCTYPE_Arr = null;

            if (poType == Util.PO_APPROVAL)
                PO_DOCTYPE_Arr = servicePO_DOCTYPE;
            else if (poType == Util.RawPO_APPROVAL)
                PO_DOCTYPE_Arr = rawPO_DOCTYPE;
            else if (poType == Util.SubPO_APPROVAL)
                PO_DOCTYPE_Arr = subPO_DOCTYPE;

            Dictionary<String, String> PO_DocType = new Dictionary<string, string>();
            for (int i = 0; i < PO_DOCTYPE_Arr.Length; i++)
            {
                String[] item = PO_DOCTYPE_Arr[i].Split(':');
                PO_DocType.Add(item[0], item[1]);
            }

            return PO_DocType;
        }

        public static User adminUser()
        {
            User admin = new User();
           
            admin.name = ConfigurationManager.AppSettings["LDAP_COMMON_USER_NAME"];
            admin.password = ConfigurationManager.AppSettings["LDAP_COMMON_USER_PASSWORD"];

            return admin;
        }


        public static RfcConfigParameters getConfigParameter() 
        {
            var settings = Common.GetSysSettings();
            RfcConfigParameters parameters = new RfcConfigParameters();
            parameters.Add(RfcConfigParameters.Name, SAP_DEST_NAME);
            parameters.Add(RfcConfigParameters.User, Cryto.decrypt(settings["SAP_User"]));
            parameters.Add(RfcConfigParameters.Password, Cryto.decrypt(settings["SAP_Password"]));
            parameters.Add(RfcConfigParameters.Client, settings["SAP_Client"]);
            parameters.Add(RfcConfigParameters.Language, "EN");
            parameters.Add(RfcConfigParameters.AppServerHost, settings["SAP_Host"]);
            parameters.Add(RfcConfigParameters.SystemNumber, settings["SAP_SysNum"]);
            parameters.Add(RfcConfigParameters.IdleTimeout, "3600");
            parameters.Add(RfcConfigParameters.PoolSize, "10");
            parameters.Add(RfcConfigParameters.PeakConnectionsLimit, "15");
            return parameters;
        }
    }
}