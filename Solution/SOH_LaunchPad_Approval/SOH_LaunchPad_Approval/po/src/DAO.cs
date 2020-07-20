using SAP.Middleware.Connector;
using SOH_LaunchPad_Approval.common;
using System;
using System.Collections.Generic;
using System.Data;

namespace SOH_LaunchPad_Approval.po.src
{
    public class DAO
    {
        public DataTable List(POApprovalDisplayRequestModel req)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PO_DISPLAY");
                rfcFunction.SetValue("I_SET", req.I_SET);
                rfcFunction.SetValue("I_CANCEL", req.I_CANCEL);
                rfcFunction.SetValue("I_USERNAME", req.I_USERNAME);

                foreach (POApprovalDisplayRequest r in req.Selection)
                {
                    IRfcTable rtable_import = rfcFunction.GetTable(r.SelName);

                    IRfcStructure itemRow = rtable_import.Metadata.LineType.CreateStructure();
                    itemRow.SetValue("SIGN", r.Sign);
                    itemRow.SetValue("OPTION", r.SelOption);
                    itemRow.SetValue("LOW", r.Low);
                    itemRow.SetValue("HIGH", r.High);

                    rtable_import.Insert(itemRow);
                }

                rfcFunction.Invoke(destination);

                IRfcTable rtable = rfcFunction.GetTable("E_T_OUT");
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

        public void PrintPreview(string pono, string guid)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PO_PDF");
                rfcFunction.SetValue("I_PO_NO", pono);
                rfcFunction.SetValue("I_GUID", guid);

                rfcFunction.Invoke(destination);
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

        public DataTable Approve(string userid, POApproveRst rst)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_PO_RELEASE");

                rfcFunction.SetValue("I_USERNAME", userid.ToUpper());
                rfcFunction.SetValue("I_CANCEL_RELEASE", rst.IsCancel == true ? "X" : "");

                IRfcTable rtable = rfcFunction.GetTable("I_T_PO_SELECTED");
                foreach (var r in rst.POReleased)
                {
                    IRfcStructure itemRow = sapRfcRepository.GetStructureMetadata("ZSOH_PO").CreateStructure();
                    itemRow.SetValue("PO", r.PONo);
                    itemRow.SetValue("SELECTED", "X");
                    rtable.Insert(itemRow);
                }

                rfcFunction.Invoke(destination);

                var msg = rfcFunction.GetString("E_MESSAGE");

                if (msg.Length > 1)
                {
                    throw new Exception("SAP: " + msg);
                }
                else
                {
                    rtable = rfcFunction.GetTable("E_T_MESSAGE");
                    var dt = SAPHelper.GetDataTableFromRfcTable(rtable);

                    return dt;
                }
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

        public bool CheckReleaseAuth(string userid)
        {
            return true;
        }

        public class POApproveRst
        {
            public bool IsCancel;
            public List<POApproveRel> POReleased;

        }

        public class POApproveRel
        {
            public string PONo;
        }

        public class POApprovalDisplayRequest
        {
            public string SelName;
            public string Sign = "I";
            public string SelOption;
            public string Low;
            public string High;
        }

        public class POApprovalDisplayRequestModel
        {
            public string I_SET;
            public string I_CANCEL;
            public string I_USERNAME;
            public List<POApprovalDisplayRequest> Selection;

            public POApprovalDisplayRequestModel()
            {                
            }
        }
    }
}