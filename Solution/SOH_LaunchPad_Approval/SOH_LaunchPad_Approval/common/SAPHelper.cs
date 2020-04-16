﻿using crystal_po_api.util;
using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;

namespace SOH_LaunchPad_Approval.common
{
    public class SAPHelper
    {
        //private static string sap_name = System.Configuration.ConfigurationManager.AppSettings["SAP_Name"].ToString();
        //private static string user_id = System.Configuration.ConfigurationManager.AppSettings["SAP_User"].ToString();
        //private static string password = System.Configuration.ConfigurationManager.AppSettings["SAP_Password"].ToString();
        //private static string client = System.Configuration.ConfigurationManager.AppSettings["SAP_Client"].ToString();
        //private static string host = System.Configuration.ConfigurationManager.AppSettings["SAP_Host"].ToString();
        //private static string sysNum = System.Configuration.ConfigurationManager.AppSettings["SAP_SysNum"].ToString();

        public static string debug_soapprover = System.Configuration.ConfigurationManager.AppSettings["Debug_SOApprover"].ToString();

        public static RfcDestination GetDest()
        {
            RfcDestination dest = RfcDestinationManager.GetDestination(ConfigUtil.SAP_DEST_NAME);

            return dest;
        }

        public static DataTable GetDataTableFromRfcTable(IRfcTable rfcTable)
        {
            DataTable dtRet = new DataTable();

            for (int liElement = 0; liElement < rfcTable.ElementCount; liElement++)
            {
                RfcElementMetadata rfcEMD = rfcTable.GetElementMetadata(liElement);
                dtRet.Columns.Add(rfcEMD.Name);
            }

            foreach (IRfcStructure row in rfcTable)
            {
                DataRow dr = dtRet.NewRow();

                for (int liElement = 0; liElement < rfcTable.ElementCount; liElement++)
                {
                    RfcElementMetadata rfcEMD = rfcTable.GetElementMetadata(liElement);

                    dr[rfcEMD.Name] = row.GetString(rfcEMD.Name);
                }

                dtRet.Rows.Add(dr);
            }

            return dtRet;
        }

        public static bool isSuccessCall(IRfcStructure callResult)
        {
            string type = callResult.GetString("TYPE");
            return !type.Equals("E") && !type.Equals("A");
        }

        public static bool isSuccessCall(IRfcTable callResult)
        {

            foreach (IRfcStructure s in callResult)
            {
                string type = s.GetString("TYPE");
                if (type.Equals("E") || type.Equals("A"))
                {
                    return false;
                }
            }
            return true;
        }

        public static string errorMessage(IRfcTable callResult, bool full = false)
        {
            if (full)
            {
                string msg = "";
                for (int i = 0; i < callResult.RowCount; i++)
                {
                    msg += callResult[i].GetString("MESSAGE") + "";
                    for (int j = 1; j < 5; j++)
                    {
                        msg += "[" + callResult[i].GetString("MESSAGE_V" + j) + "]";
                    }
                    msg += "\r\n";
                }
                return msg;
            }
            else
            {
                return callResult[0].GetString("MESSAGE");
            }
        }
    }
}