using SAP.Middleware.Connector;
using SOH_LaunchPad_Approval.common;
using System;
using System.Collections.Generic;
using System.Data;

namespace SOH_LaunchPad_Approval.confirmsoplan.src
{
    public class DAO
    {
        public DataTable List(ConfirmSOPlanDisplayRequestModel req)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_ZSD176_DISPLAY");
                IRfcTable rtable_import = rfcFunction.GetTable("I_T_SO");

                foreach (ConfirmSOPlanDisplayRequest r in req.Selection)
                {
                    IRfcStructure itemRow = sapRfcRepository.GetStructureMetadata("RSPARAMS").CreateStructure();
                    itemRow.SetValue("SELNAME", r.SelName);
                    itemRow.SetValue("KIND", r.Kind);
                    itemRow.SetValue("SIGN", r.Sign);
                    itemRow.SetValue("OPTION", r.SelOption);
                    itemRow.SetValue("LOW", r.Low);
                    itemRow.SetValue("HIGH", r.High);

                    rtable_import.Insert(itemRow);
                }

                rfcFunction.Invoke(destination);

                IRfcTable rtable = rfcFunction.GetTable("E_T_DATA");
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

        public bool CheckReleaseAuth(string userid)
        {
            return true;
        }


        public DataTable Approve(string userid, ConfirmSOPlanApproveRst rst)
        {
            RfcDestination destination = SAPHelper.GetDest();

            RfcSessionManager.BeginContext(destination);
            try
            {
                RfcRepository sapRfcRepository = destination.Repository;

                IRfcFunction rfcFunction = sapRfcRepository.CreateFunction("ZBAPI_SOH_ZSD176_CONFIRM");
                rfcFunction.SetValue("I_USERNAME", userid.ToUpper());

                IRfcTable rtable = rfcFunction.GetTable("E_T_MESSAGE");
                foreach (var r in rst.SOReleased)
                {
                    IRfcStructure itemRow = sapRfcRepository.GetStructureMetadata("ZRETURN_MESSAGE").CreateStructure();
                    itemRow.SetValue("OBJECTID", r);
                    rtable.Insert(itemRow);
                }

                rfcFunction.Invoke(destination);

                rtable = rfcFunction.GetTable("E_T_MESSAGE");
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

        public class ConfirmSOPlanApproveRst
        {
            public List<string> SOReleased;
        }

        public class ConfirmSOPlanDisplayRequest
        {
            public string SelName;
            public string Kind;
            public string Sign;
            public string SelOption;
            public string Low;
            public string High;
        }

        public class ConfirmSOPlanDisplayRequestModel
        {
            public List<ConfirmSOPlanDisplayRequest> Selection;

            public ConfirmSOPlanDisplayRequestModel()
            {
                Selection = new List<ConfirmSOPlanDisplayRequest>();
            }
        }
    }
}