import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"



export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false);
//for bug 5 part 1
  const[isEmployeesloading, setIsEmployeesLoading]=useState(false);
  //
  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  //bug 6 part 1
  const isPaginated =paginatedTransactions !==null;
  const hasMorePages = paginatedTransactions?.nextPage!==null;

//
  const loadAllTransactions = useCallback(async () => {
  // 
  
    setIsEmployeesLoading(true);
    //
    setIsLoading(true);
    transactionsByEmployeeUtils.invalidateData();
    //
    await Promise.all([
      employeeUtils.fetchAll().finally(()=> setIsEmployeesLoading(false)),// for employees
      paginatedTransactionsUtils.fetchAll().finally(()=>setIsLoading(false)),

    ]);
    

    
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeesloading} //loading state for employee
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }  // for bug 4
              if(newValue.id===EMPTY_EMPLOYEE.id){
                await loadAllTransactions();
              }else{
                await loadTransactionsByEmployee(newValue.id)
              }
//


            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {isPaginated && hasMorePages && transactions !== null  &&(
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                setIsLoading(true);
                await paginatedTransactionsUtils.fetchAll().finally(()=>setIsLoading(false));
              }}
            >
              {paginatedTransactionsUtils.loading ?"loading...":"View More"}
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
