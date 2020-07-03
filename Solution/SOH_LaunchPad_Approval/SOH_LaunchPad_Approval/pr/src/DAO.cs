using SAP.Middleware.Connector;
using System;
using System.Collections.Generic;
using System.Data;
using SOH_LaunchPad_Approval.common;

namespace SOH_LaunchPad_Approval.pr.src
{
    public class DAO
    {
        public DataTable List(string userid, string prno, string relcode)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PR_DISPLAY");
                rfcFunction.SetValue("I_PR_NO", prno);
                rfcFunction.SetValue("I_RELEASE_CODE", relcode);

                rfcFunction.Invoke(destination);

                IRfcTable rtable = rfcFunction.GetTable("E_T_PR_LIST");
                var dt = SAPHelper.GetDataTableFromRfcTable(rtable);
                var msg = rfcFunction.GetString("E_MESSAGE");

                if(msg.Length > 1)
                {
                    throw new Exception("SAP: " + msg);
                }
                else if (dt.Rows.Count > 0)
                {
                    var row = dt.Rows[0];
                    var plant = row["PLANT"].ToString();

                    if(!CheckReleaseAuth(userid, plant, relcode))
                    {
                        throw new Exception("You have No Access Rights for this Requisition! ");
                    }

                    DataColumn newColumn = new DataColumn("RelCode", typeof(string));
                    newColumn.DefaultValue = relcode;
                    dt.Columns.Add(newColumn);
                }

                return dt;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public bool CheckReleaseAuth(string userid, string plant, string relCode)
        {
            bool Check_1 = Common.CheckAccessByName(userid, "Approve_PR_Plant", new List<string>() { plant });
            bool Check_2 = Common.CheckAccessByName(userid, "Approve_PR_ReleaseCode", new List<string>() { relCode });

            return Check_1 & Check_2;
        }

        public DataTable Approve(string userid, bool isCancel, PRApproveRst rst)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PR_RELEASE");

                rfcFunction.SetValue("I_USERNAME", userid.ToUpper());
                rfcFunction.SetValue("I_RELEASE_CODE", rst.RelCode);
                rfcFunction.SetValue("I_CANCEL_RELEASE", isCancel == true? "X":"");

                IRfcTable rtable = rfcFunction.GetTable("I_T_PR");
                foreach (var r in rst.PRReleased)
                {
                    IRfcStructure itemRow = sapRfcRepository.GetStructureMetadata("ZSOH_PR").CreateStructure();
                    itemRow.SetValue("PR_NO", rst.PRNo);
                    itemRow.SetValue("PR_ITEM_NO", r.PRItemNo);
                    itemRow.SetValue("SELECTED", "X");
                    rtable.Insert(itemRow);
                }

                rfcFunction.Invoke(destination);

                rtable = rfcFunction.GetTable("ET_MESSAGE");
                var dt = SAPHelper.GetDataTableFromRfcTable(rtable);

                return dt;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                RfcSessionManager.EndContext(destination);
            }
        }

        public class PRApproveRst
        {
            public string PRNo;
            public string RelCode;

            public List<PRApproveRel> PRReleased;

        }

        public class PRApproveRel
        {
            public string PRItemNo;
        }
    }

}