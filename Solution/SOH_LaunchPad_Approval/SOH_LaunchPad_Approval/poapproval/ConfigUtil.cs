using crystal.model;
using crystal.util;
using crystal_sap_cryto;
using SAP.Middleware.Connector;
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
        public static String SAP_DEST_NAME = "CRYSTAL_PO_SAP";

        private static String client = ConfigurationManager.AppSettings["SAP_CLIENT"];
        private static String sysnr = ConfigurationManager.AppSettings["SAP_SYSNR"];
        private static String host = ConfigurationManager.AppSettings["SAP_HOST"];

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
            using (SqlConnection conn = new SqlConnection(ConfigurationManager.AppSettings["UAC_DB_CONNECTION"]))
            {
                conn.Open();
                using(SqlCommand cmd = new SqlCommand())
                {
                    cmd.Connection = conn;
                    cmd.CommandType = System.Data.CommandType.Text;
                    cmd.CommandText = "select * from SAP_User";
                    using (SqlDataReader r = cmd.ExecuteReader())
                    {
                        if (r.Read())
                        {
                            RfcConfigParameters parameters = new RfcConfigParameters();

                            parameters[RfcConfigParameters.PoolSize] = "10";
                            parameters[RfcConfigParameters.Language] = "EN";
                            parameters[RfcConfigParameters.PeakConnectionsLimit] = Convert.ToString(10);
                            parameters[RfcConfigParameters.MaxPoolSize] = Convert.ToString(10);
                            parameters[RfcConfigParameters.IdleTimeout] = Convert.ToString(0.1); // we keep connections for 1 minutes
                            parameters[RfcConfigParameters.User] = r["name"].ToString();
                            parameters[RfcConfigParameters.Password] = Cryto.decrypt(r["pw"].ToString());
                            parameters[RfcConfigParameters.Client] = client;
                            parameters[RfcConfigParameters.Name] = SAP_DEST_NAME;
                            parameters[RfcConfigParameters.AppServerHost] = host;
                            parameters[RfcConfigParameters.SystemNumber] = sysnr;
                            
                            return parameters;
                        }
                        else
                        {
                            throw new Exception("cannot connect to UAC DB to get SAP login info.");
                        }
                    }
                }
            }
        }
    }
}